from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.dateparse import parse_date
from django.contrib.auth import authenticate
import pandas as pd

from .models import CustomUser, Parceiro, CanalVenda
from .serializers import ParceiroSerializer, CanalVendaSerializer


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identificador = request.data.get('identificador')
        senha = request.data.get('senha')

        user = (
            CustomUser.objects.filter(username=identificador).first() or
            CustomUser.objects.filter(email=identificador).first()
        )

        if not user and identificador and identificador.isdigit():
            user = CustomUser.objects.filter(id_vendedor=int(identificador)).first()

        if user and user.check_password(senha) and user.is_active:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'usuario': {
                    'username': user.username,
                    'email': user.email,
                    'tipo_user': user.tipo_user,
                    'canais_venda': [c.nome for c in user.canais_venda.all()],
                    'id_vendedor': user.id_vendedor,
                    'primeiro_acesso': user.primeiro_acesso,
                }
            })

        return Response({'erro': 'Credenciais inválidas'}, status=status.HTTP_401_UNAUTHORIZED)


class ParceiroCreateUpdateView(APIView):
    def post(self, request):
        data = request.data
        codigo = data.get('codigo')

        if not codigo:
            return Response({'erro': 'Código do parceiro é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

        canal_id = data.get('canal_venda_id') or data.get('canal_venda')
        canal = CanalVenda.objects.filter(id=canal_id).first() if canal_id else None

        parceiro, created = Parceiro.objects.update_or_create(
            codigo=codigo,
            defaults={
                'parceiro': data.get('parceiro'),
                'classificacao': data.get('classificacao'),
                'consultor': data.get('consultor'),
                'unidade': data.get('unidade'),
                'cidade': data.get('cidade'),
                'uf': data.get('uf'),
                'canal_venda': canal
            }
        )

        return Response({
            'mensagem': 'Parceiro criado' if created else 'Parceiro atualizado',
            'parceiro_id': parceiro.id
        })


class UploadParceirosView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, format=None):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'erro': 'Arquivo não enviado.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(file_obj) if file_obj.name.endswith('.xlsx') else pd.read_csv(file_obj)
            criados = 0
            atualizados = 0

            for _, row in df.iterrows():
                parceiro, created = Parceiro.objects.update_or_create(
                    codigo=row['Código'],
                    defaults={
                        'parceiro': row.get('Parceiro'),
                        'classificacao': row.get('Classif.') or row.get('Classificação'),
                        'consultor': row.get('Consultor'),
                        'unidade': row.get('Unidade'),
                        'cidade': row.get('Cidade'),
                        'uf': row.get('UF'),
                        'primeiro_fat': parse_date(str(row.get('Primeiro Fat'))),
                        'ultimo_fat': parse_date(str(row.get('Último Fat'))),
                        'janeiro': row.get('janeiro', 0),
                        'fevereiro': row.get('fevereiro', 0),
                        'marco': row.get('março', 0) or row.get('marco', 0),
                        'abril': row.get('abril', 0),
                        'maio': row.get('maio', 0),
                        'junho': row.get('junho', 0),
                        'julho': row.get('julho', 0),
                        'agosto': row.get('agosto', 0),
                        'setembro': row.get('setembro', 0),
                        'outubro': row.get('outubro', 0),
                        'novembro': row.get('novembro', 0),
                        'dezembro': row.get('dezembro', 0),
                        'janeiro_2': row.get('janeiro.1', 0),
                        'fevereiro_2': row.get('fevereiro.1', 0),
                        'marco_2': row.get('março.1', 0) or row.get('marco.1', 0),
                    }
                )
                if row.get('Canal'):
                    canal_nome = str(row.get('Canal')).strip()
                    canal_obj, _ = CanalVenda.objects.get_or_create(nome=canal_nome)
                    parceiro.canal_venda = canal_obj
                    parceiro.save()

                if created:
                    criados += 1
                else:
                    atualizados += 1

            return Response({
                'mensagem': 'Upload processado com sucesso!',
                'criadas': criados,
                'atualizadas': atualizados,
            })
        except Exception as e:
            return Response({'erro': f'Erro ao processar o arquivo: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ViewSets para uso em frontend (React, etc)

class ParceiroViewSet(viewsets.ModelViewSet):
    queryset = Parceiro.objects.all()
    serializer_class = ParceiroSerializer
    ppermission_classes = [permissions.AllowAny]


class CanalVendaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CanalVenda.objects.all()
    serializer_class = CanalVendaSerializer
    permission_classes = [permissions.IsAuthenticated]
