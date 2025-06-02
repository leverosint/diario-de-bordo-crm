from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.timezone import now
from datetime import timedelta, datetime
import pandas as pd
from django.http import HttpResponse
import io
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Parceiro, CanalVenda, Interacao, Oportunidade
from .serializers import (
    ParceiroSerializer,
    CanalVendaSerializer,
    InteracaoSerializer,
    InteracaoPendentesSerializer,
    OportunidadeSerializer,
)

User = get_user_model()

# ===== Parceiro =====
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

# ===== Upload Parceiros (Excel) =====
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

                    Parceiro.objects.update_or_create(
                        codigo=parceiro_data['codigo'],
                        defaults=parceiro_data
                    )

            return Response({'mensagem': 'Parceiros importados com sucesso'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ===== Login JWT =====
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identificador = request.data.get('identificador')
        senha = request.data.get('senha')

        user = (
            User.objects.filter(username=identificador).first()
            or User.objects.filter(email=identificador).first()
            or User.objects.filter(id_vendedor=identificador).first()
        )

        if user and user.check_password(senha):
            refresh = RefreshToken.for_user(user)
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "usuario": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "tipo_user": user.tipo_user,
                    "id_vendedor": user.id_vendedor,
                    "canais_venda": [canal.nome for canal in user.canais_venda.all()],
                }
            })
        else:
            return Response({"erro": "Credenciais inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

# ===== Canal Venda =====
class CanalVendaListView(generics.ListAPIView):
    queryset = CanalVenda.objects.all()
    serializer_class = CanalVendaSerializer
    permission_classes = [IsAuthenticated]

class CanalVendaViewSet(viewsets.ModelViewSet):
    queryset = CanalVenda.objects.all()
    serializer_class = CanalVendaSerializer

# ===== Interações =====
class InteracaoViewSet(viewsets.ModelViewSet):
    serializer_class = InteracaoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.tipo_user == 'ADMIN':
            return Interacao.objects.all()
        elif user.tipo_user == 'GESTOR':
            return Interacao.objects.filter(parceiro__canal_venda__in=user.canais_venda.all())
        elif user.tipo_user == 'VENDEDOR':
            return Interacao.objects.filter(usuario=user)
        return Interacao.objects.none()

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class InteracoesHojeView(generics.ListAPIView):
    serializer_class = InteracaoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        hoje = now().date()
        return Interacao.objects.filter(data_interacao__date=hoje, usuario=self.request.user)

class InteracoesPendentesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        hoje = now().date()
        limite_data = hoje - timedelta(days=3)

        if usuario.tipo_user == 'VENDEDOR':
            parceiros = Parceiro.objects.filter(consultor=usuario.id_vendedor)
        elif usuario.tipo_user == 'GESTOR':
            parceiros = Parceiro.objects.filter(canal_venda__in=usuario.canais_venda.all())
        else:
            parceiros = Parceiro.objects.all()

        parceiros_pendentes = []
        parceiros_interagidos = []

        for parceiro in parceiros:
            ultima_interacao = parceiro.interacoes.order_by('-data_interacao').first()
            interagido_hoje = ultima_interacao and ultima_interacao.data_interacao.date() == hoje
            em_periodo_bloqueio = (
                ultima_interacao and 
                ultima_interacao.entrou_em_contato and 
                ultima_interacao.data_interacao.date() > limite_data and
                ultima_interacao.data_interacao.date() < hoje
            )

            if interagido_hoje:
                parceiros_interagidos.append({
                    'id': parceiro.id,
                    'parceiro': parceiro.parceiro,
                    'unidade': parceiro.unidade,
                    'classificacao': parceiro.classificacao,
                    'status': parceiro.status,
                    'tipo': ultima_interacao.tipo,
                    'data_interacao': ultima_interacao.data_interacao,
                    'entrou_em_contato': ultima_interacao.entrou_em_contato,
                })
            elif not em_periodo_bloqueio:
                parceiros_pendentes.append({
                    'id': parceiro.id,
                    'parceiro': parceiro.parceiro,
                    'unidade': parceiro.unidade,
                    'classificacao': parceiro.classificacao,
                    'status': parceiro.status,
                    'tipo': '',
                    'data_interacao': '',
                    'entrou_em_contato': False,
                })

        tipo_lista = request.query_params.get('tipo', 'pendentes')
        if tipo_lista == 'interagidos':
            return Response(parceiros_interagidos)
        return Response(parceiros_pendentes)

class InteracoesMetasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        hoje = now().date()

        interacoes_hoje = Interacao.objects.filter(
            usuario=usuario,
            data_interacao__date=hoje
        ).count()

        meta_diaria = 10
        progresso = min(interacoes_hoje / meta_diaria, 1.0)
        meta_atingida = interacoes_hoje >= meta_diaria

        return Response({
            'interacoes_realizadas': interacoes_hoje,
            'meta_diaria': meta_diaria,
            'progresso': progresso,
            'meta_atingida': meta_atingida
        })

class HistoricoInteracoesView(generics.ListAPIView):
    serializer_class = InteracaoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        parceiro_id = self.request.query_params.get('parceiro_id')
        return Interacao.objects.filter(parceiro_id=parceiro_id).order_by('-data_interacao')

class RegistrarInteracaoView(generics.CreateAPIView):
    serializer_class = InteracaoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

# ===== Oportunidades =====
class OportunidadeViewSet(viewsets.ModelViewSet):
    serializer_class = OportunidadeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.tipo_user == 'ADMIN':
            return Oportunidade.objects.all()
        elif user.tipo_user == 'GESTOR':
            return Oportunidade.objects.filter(parceiro__canal_venda__in=user.canais_venda.all())
        elif user.tipo_user == 'VENDEDOR':
            return Oportunidade.objects.filter(parceiro__consultor=user.id_vendedor)
        return Oportunidade.objects.none()

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)  # <--- ADICIONADO
