from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from django.db import transaction
import pandas as pd

from .models import Parceiro, CanalVenda
from .serializers import ParceiroSerializer, CanalVendaSerializer


class ParceiroViewSet(viewsets.ModelViewSet):
    queryset = Parceiro.objects.all()
    serializer_class = ParceiroSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.tipo_user == 'ADMIN':
            return Parceiro.objects.all()
        elif user.tipo_user == 'GESTOR':
            return Parceiro.objects.filter(canal_venda__in=user.canais_venda.all())
        elif user.tipo_user == 'VENDEDOR':
            return Parceiro.objects.filter(consultor=user.id_vendedor)
        return Parceiro.objects.none()


class UploadParceirosView(viewsets.ViewSet):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]

    def create(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'erro': 'Arquivo não enviado'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(file_obj)
        except Exception as e:
            return Response({'erro': f'Erro ao ler arquivo: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                for _, row in df.iterrows():
                    canal_nome = str(row.get('Canal de Venda')).strip()
                    canal, _ = CanalVenda.objects.get_or_create(nome=canal_nome)

                    parceiro_data = {
                        'codigo': str(row.get('Código')).strip(),
                        'parceiro': row.get('Parceiro', '').strip(),
                        'classificacao': row.get('Classificação', '').strip(),
                        'consultor': str(row.get('Consultor')).strip(),
                        'cidade': row.get('Cidade', '').strip(),
                        'uf': row.get('UF', '').strip(),
                        'unidade': row.get('Unidade', '').strip(),
                        'canal_venda': canal,
                        'janeiro': row.get('Janeiro', 0) or 0,
                        'fevereiro': row.get('Fevereiro', 0) or 0,
                        'marco': row.get('Março', 0) or 0,
                        'abril': row.get('Abril', 0) or 0,
                        'maio': row.get('Maio', 0) or 0,
                        'junho': row.get('Junho', 0) or 0,
                        'julho': row.get('Julho', 0) or 0,
                        'agosto': row.get('Agosto', 0) or 0,
                        'setembro': row.get('Setembro', 0) or 0,
                        'outubro': row.get('Outubro', 0) or 0,
                        'novembro': row.get('Novembro', 0) or 0,
                        'dezembro': row.get('Dezembro', 0) or 0,
                        'janeiro_2': row.get('Janeiro 2', 0) or 0,
                        'fevereiro_2': row.get('Fevereiro 2', 0) or 0,
                        'marco_2': row.get('Março 2', 0) or 0,
                    }

                    parceiro_obj, _ = Parceiro.objects.update_or_create(
                        codigo=parceiro_data['codigo'],
                        defaults=parceiro_data
                    )
                    parceiro_obj.save()

            return Response({'mensagem': 'Parceiros importados com sucesso'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)

        if user is not None:
            return Response({
                "message": "Login realizado com sucesso",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "tipo_user": user.tipo_user,
                    "canais_venda": [canal.nome for canal in user.canais_venda.all()],
                }
            })
        else:
            return Response({"error": "Credenciais inválidas"}, status=status.HTTP_401_UNAUTHORIZED)


class CanalVendaListView(generics.ListAPIView):
    queryset = CanalVenda.objects.all()
    serializer_class = CanalVendaSerializer
    permission_classes = [IsAuthenticated]


class ParceiroCreateUpdateView(generics.CreateAPIView):
    queryset = Parceiro.objects.all()
    serializer_class = ParceiroSerializer
    permission_classes = [IsAuthenticated]


class CanalVendaViewSet(viewsets.ModelViewSet):
    queryset = CanalVenda.objects.all()
    serializer_class = CanalVendaSerializer
