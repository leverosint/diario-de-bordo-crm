from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.timezone import now
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from datetime import timedelta
import pandas as pd
from rest_framework_simplejwt.tokens import RefreshToken
from collections import defaultdict
from django.utils.timezone import make_aware
from datetime import datetime
from .serializers import ParceiroSerializer


from .models import Parceiro, CanalVenda, Interacao, Oportunidade, GatilhoExtra, CustomUser
from .serializers import (
    ParceiroSerializer,
    CanalVendaSerializer,
    InteracaoSerializer,
    OportunidadeSerializer,
    GatilhoExtraSerializer,
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
# ===== Upload Parceiros (Excel) =====
class UploadParceirosView(viewsets.ViewSet):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]

    def create(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'erro': 'Arquivo não enviado'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(file_obj, skiprows=1, header=None)
            df.columns = [
                'codigo', 'parceiro', 'classificacao', 'consultor', 'unidade',
                'cidade', 'uf', 'primeiro_fat', 'ultimo_fat',
                'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
                'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
                'janeiro_2', 'fevereiro_2', 'marco_2'
            ]
        except Exception as e:
            return Response({'erro': f'Erro ao ler arquivo: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        def parse_data(val):
            if pd.isna(val):
                return None
            if isinstance(val, str):
                try:
                    return pd.to_datetime(val).date()
                except Exception:
                    return None
            if isinstance(val, pd.Timestamp):
                return val.date()
            return None

        def parse_val(val):
            try:
                if pd.isna(val) or val == "nan":
                    return 0
                return float(str(val).replace("R$", "").replace(",", ".").strip())
            except:
                return 0

        criadas = 0
        atualizadas = 0

        try:
            with transaction.atomic():
                for _, row in df.iterrows():
                    canal_nome = "Canal Padrão"
                    canal, _ = CanalVenda.objects.get_or_create(nome=canal_nome)

                    parceiro_data = {
                        'codigo': str(row['codigo']).strip(),
                        'parceiro': str(row['parceiro']).strip(),
                        'classificacao': str(row['classificacao']).strip(),
                        'consultor': str(row['consultor']).strip(),
                        'unidade': str(row['unidade']).strip(),
                        'cidade': str(row['cidade']).strip(),
                        'uf': str(row['uf']).strip(),
                        'primeiro_fat': parse_data(row['primeiro_fat']),
                        'ultimo_fat': parse_data(row['ultimo_fat']),
                        'canal_venda': canal,
                        'janeiro': parse_val(row['janeiro']),
                        'fevereiro': parse_val(row['fevereiro']),
                        'marco': parse_val(row['marco']),
                        'abril': parse_val(row['abril']),
                        'maio': parse_val(row['maio']),
                        'junho': parse_val(row['junho']),
                        'julho': parse_val(row['julho']),
                        'agosto': parse_val(row['agosto']),
                        'setembro': parse_val(row['setembro']),
                        'outubro': parse_val(row['outubro']),
                        'novembro': parse_val(row['novembro']),
                        'dezembro': parse_val(row['dezembro']),
                        'janeiro_2': parse_val(row['janeiro_2']),
                        'fevereiro_2': parse_val(row['fevereiro_2']),
                        'marco_2': parse_val(row['marco_2']),
                    }

                    parceiro_obj, created = Parceiro.objects.update_or_create(
                        codigo=parceiro_data['codigo'],
                        defaults=parceiro_data
                    )

                    # 🔄 Garante que o .save() com lógica personalizada seja executado
                    parceiro_obj.save()

                    if created:
                        criadas += 1
                    else:
                        atualizadas += 1

            return Response({
                'mensagem': 'Upload concluído com sucesso.',
                'criadas': criadas,
                'atualizadas': atualizadas
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





# ===== Login JWT =====
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identificador = request.data.get('identificador')
        senha = request.data.get('senha')

        if not identificador or not senha:
            return Response({"erro": "Informe identificador e senha."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = (
                User.objects.filter(username=identificador).first()
                or User.objects.filter(email=identificador).first()
                or User.objects.filter(id_vendedor=identificador).first()
            )

            if user is None:
                return Response({"erro": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)

            if not user.check_password(senha):
                return Response({"erro": "Senha incorreta."}, status=status.HTTP_401_UNAUTHORIZED)

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
                    "canais_venda": [
                        {"id": canal.id, "nome": canal.nome}
                        for canal in user.canais_venda.all()
                    ],
                }
            })

        except Exception as e:
            print('Erro no login:', str(e))
            return Response({"erro": "Erro no servidor."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





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
        parceiro = serializer.validated_data['parceiro']
        status_no_momento = parceiro.status
        serializer.save(usuario=self.request.user, status=status_no_momento)


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

 # 🎯 Filtros por canal_id ou consultor
        canal_id = request.query_params.get('canal_id')
        consultor = request.query_params.get('consultor')

        if canal_id:
            parceiros = parceiros.filter(canal_venda_id=canal_id)
        if consultor:
            parceiros = parceiros.filter(consultor=consultor)

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

            responsavel_id = parceiro.consultor
            gatilho = GatilhoExtra.objects.filter(parceiro=parceiro, usuario__id_vendedor=responsavel_id).first()

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
                    'gatilho_extra': gatilho.descricao if gatilho else None,
                })
            elif not em_periodo_bloqueio or gatilho:
                parceiros_pendentes.append({
                    'id': parceiro.id,
                    'parceiro': parceiro.parceiro,
                    'unidade': parceiro.unidade,
                    'classificacao': parceiro.classificacao,
                    'status': parceiro.status,
                    'tipo': '',
                    'data_interacao': '',
                    'entrou_em_contato': False,
                    'gatilho_extra': gatilho.descricao if gatilho else None,
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
        parceiro = serializer.validated_data['parceiro']
        status_no_momento = parceiro.status
        serializer.save(usuario=self.request.user, status=status_no_momento)


# ===== Oportunidades =====
class OportunidadeViewSet(viewsets.ModelViewSet):
    serializer_class = OportunidadeSerializer
    permission_classes = [IsAuthenticated]
        
    def get_queryset(self):
        user = self.request.user
        queryset = Oportunidade.objects.all()

        if user.tipo_user == 'GESTOR':
            queryset = queryset.filter(parceiro__canal_venda__in=user.canais_venda.all())
        elif user.tipo_user == 'VENDEDOR':
            queryset = queryset.filter(parceiro__consultor=user.id_vendedor)

        canal_id = self.request.query_params.get('canal_id')
        consultor = self.request.query_params.get('consultor')

        if canal_id:
            queryset = queryset.filter(parceiro__canal_venda_id=canal_id)
        if consultor:
            queryset = queryset.filter(parceiro__consultor=consultor)

        return queryset
    

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

# ... 🛑 o código é muito grande para caber aqui, quer que eu continue com o Dashboard KPIs, Funil, Oportunidades Mensais e o endpoint usuarios_por_canal em mais uma sequência?
# ===== Dashboard KPIs + Parceiros =====
class DashboardKPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        mes = int(request.query_params.get('mes', now().month))
        ano = int(request.query_params.get('ano', now().year))

        # Data do mês filtrado
        data_inicio = make_aware(datetime(ano, mes, 1))
        if mes == 12:
            data_fim = make_aware(datetime(ano + 1, 1, 1))
        else:
            data_fim = make_aware(datetime(ano, mes + 1, 1))

        # ========= 1. FILTROS POR TIPO DE USUÁRIO ========= #
        if user.tipo_user == 'ADMIN':
            parceiros_vivos = Parceiro.objects.all()
            interacoes = Interacao.objects.filter(data_interacao__range=(data_inicio, data_fim))
            oportunidades = Oportunidade.objects.filter(data_criacao__range=(data_inicio, data_fim))
        elif user.tipo_user == 'GESTOR':
            parceiros_vivos = Parceiro.objects.filter(canal_venda__in=user.canais_venda.all())
            interacoes = Interacao.objects.filter(
                parceiro__canal_venda__in=user.canais_venda.all(),
                data_interacao__range=(data_inicio, data_fim)
            )
            oportunidades = Oportunidade.objects.filter(
                parceiro__canal_venda__in=user.canais_venda.all(),
                data_criacao__range=(data_inicio, data_fim)
            )
        else:  # VENDEDOR
            parceiros_vivos = Parceiro.objects.filter(consultor=user.id_vendedor)
            interacoes = Interacao.objects.filter(usuario=user, data_interacao__range=(data_inicio, data_fim))
            oportunidades = Oportunidade.objects.filter(usuario=user, data_criacao__range=(data_inicio, data_fim))

        # ========= 2. KPIs VIVOS (status atual dos parceiros) ========= #
        status_counts = {
            'Sem Faturamento': parceiros_vivos.filter(status='Sem Faturamento').count(),
            'Base Ativa': parceiros_vivos.filter(status='Base Ativa').count(),
            '30 dias s/ Fat': parceiros_vivos.filter(status='30 dias s/ Fat').count(),
            '60 dias s/ Fat': parceiros_vivos.filter(status='60 dias s/ Fat').count(),
            '90 dias s/ Fat': parceiros_vivos.filter(status='90 dias s/ Fat').count(),
            '120 dias s/ Fat': parceiros_vivos.filter(status='120 dias s/ Fat').count(),
        }

        # ========= 3. KPIs numéricos de interações/oportunidades ========= #
        total_interacoes = interacoes.count()
        total_oportunidades = oportunidades.count()
        total_orcamentos = oportunidades.filter(etapa='orcamento').count()
        total_pedidos = oportunidades.filter(etapa='pedido').count()
        valor_total = oportunidades.aggregate(Sum('valor'))['valor__sum'] or 0
        ticket_medio = (valor_total / total_pedidos) if total_pedidos > 0 else 0

        taxa_interacao_oportunidade = (total_oportunidades / total_interacoes * 100) if total_interacoes > 0 else 0
        taxa_oportunidade_orcamento = (total_orcamentos / total_oportunidades * 100) if total_oportunidades > 0 else 0
        taxa_orcamento_pedido = (total_pedidos / total_orcamentos * 100) if total_orcamentos > 0 else 0

        kpis = [
            {"title": "Sem Faturamento", "value": status_counts['Sem Faturamento']},
            {"title": "Base Ativa", "value": status_counts['Base Ativa']},
            {"title": "30 dias s/ Fat", "value": status_counts['30 dias s/ Fat']},
            {"title": "60 dias s/ Fat", "value": status_counts['60 dias s/ Fat']},
            {"title": "90 dias s/ Fat", "value": status_counts['90 dias s/ Fat']},
            {"title": "120 dias s/ Fat", "value": status_counts['120 dias s/ Fat']},
            {"title": "Interações", "value": total_interacoes},
            {"title": "Oportunidades", "value": total_oportunidades},
            {"title": "Taxa Interação > Oportunidade", "value": f"{taxa_interacao_oportunidade:.1f}%"},
            {"title": "Taxa Oportunidade > Orçamento", "value": f"{taxa_oportunidade_orcamento:.1f}%"},
            {"title": "Taxa Orçamento > Pedido", "value": f"{taxa_orcamento_pedido:.1f}%"},
            {"title": "Valor Gerado", "value": f"R$ {valor_total:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')},
            {"title": "Ticket Médio", "value": f"R$ {ticket_medio:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')},
        ]

                # ========= 4. Interações por Status (agrupado por status da interação no mês) ========= #
        interacoes_por_status = (
            interacoes.values('status')
            .annotate(total=Count('id'))
        )
        interacoes_status_dict = {
            item['status'] or 'Sem Status': item['total']
            for item in interacoes_por_status
        }

        # ========= 5. Parceiros contatados por status (primeira interação do mês) ========= #
        primeiras_interacoes = (
            interacoes.order_by('parceiro_id', 'data_interacao')
            .distinct('parceiro_id')
        )
        parceiros_contatados_status = defaultdict(int)
        for interacao in primeiras_interacoes:
            status = interacao.status or 'Sem Status'
            parceiros_contatados_status[status] += 1

        # ========= 6. Parceiros sem nenhuma interação no mês, agrupado por status ========= #
        ids_com_interacao = interacoes.values_list('parceiro_id', flat=True).distinct()
        sem_interacao = parceiros_vivos.exclude(id__in=ids_com_interacao)

        sem_interacao_por_status = (
            sem_interacao.values('status')
            .annotate(total=Count('id'))
        )
        parceiros_sem_fat_status = {
            item['status'] or 'Sem Status': item['total']
            for item in sem_interacao_por_status
        }

        # Serialize os parceiros_vivos
        parceiros_serializados = ParceiroSerializer(parceiros_vivos, many=True).data

        return Response({
    "kpis": kpis,
    "interacoes_status": interacoes_status_dict,
    "parceiros_contatados_status": parceiros_contatados_status,
    "parceiros_sem_fat_status": parceiros_sem_fat_status,
    "parceiros": parceiros_serializados  # ✅ ESSENCIAL para o dashboard funcionar corretamente
})





      


# ===== Funil de Conversão =====
class DashboardFunilView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.tipo_user == 'ADMIN':
            interacoes = Interacao.objects.all()
            oportunidades = Oportunidade.objects.all()
        elif user.tipo_user == 'GESTOR':
            interacoes = Interacao.objects.filter(parceiro__canal_venda__in=user.canais_venda.all())
            oportunidades = Oportunidade.objects.filter(parceiro__canal_venda__in=user.canais_venda.all())
        else:
            interacoes = Interacao.objects.filter(usuario=user)
            oportunidades = Oportunidade.objects.filter(usuario=user)

        return Response([
            {"name": "Interações", "value": interacoes.count()},
            {"name": "Oportunidades", "value": oportunidades.filter(etapa='oportunidade').count()},
            {"name": "Orçamentos", "value": oportunidades.filter(etapa='orcamento').count()},
            {"name": "Perdidas", "value": oportunidades.filter(etapa='perdida').count()},
            {"name": "Pedidos", "value": oportunidades.filter(etapa='pedido').count()},
            {"name": "Perdidas", "value": oportunidades.filter(etapa='perdida').count()},
            
        ])


# ===== Evolução Mensal de Oportunidades =====
class DashboardOportunidadesMensaisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.tipo_user == 'ADMIN':
            oportunidades = Oportunidade.objects.all()
        elif user.tipo_user == 'GESTOR':
            oportunidades = Oportunidade.objects.filter(parceiro__canal_venda__in=user.canais_venda.all())
        else:
            oportunidades = Oportunidade.objects.filter(usuario=user)

        dados = oportunidades.annotate(mes=TruncMonth('data_criacao')) \
            .values('mes') \
            .annotate(total=Count('id')) \
            .order_by('mes')

        return Response([
            {
                "mes": dado['mes'].strftime('%b %Y'),
                "oportunidades": dado['total']
            }
            for dado in dados
        ])

# ===== Upload Gatilhos Extras (Excel) =====
class UploadGatilhosExtrasView(viewsets.ViewSet):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]

    def create(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'erro': 'Arquivo não enviado'}, status=status.HTTP_400_BAD_REQUEST)

        if not file_obj.name.endswith('.xlsx'):
            return Response({'erro': 'Formato inválido. Envie um arquivo .xlsx.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(file_obj)
            required_columns = ['ID Parceiro', 'ID Usuario', 'Gatilho']
            if not all(col in df.columns for col in required_columns):
                return Response({'erro': f'Colunas inválidas. As colunas obrigatórias são: {", ".join(required_columns)}'}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                for _, row in df.iterrows():
                    parceiro_id = row.get('ID Parceiro')
                    usuario_id = row.get('ID Usuario')
                    descricao = str(row.get('Gatilho')).strip()

                    if pd.isna(parceiro_id) or pd.isna(usuario_id) or not descricao:
                        continue

                    parceiro = Parceiro.objects.get(id=int(parceiro_id))
                    usuario = User.objects.get(id=int(usuario_id))

                    GatilhoExtra.objects.update_or_create(
                        parceiro=parceiro,
                        usuario=usuario,
                        defaults={'descricao': descricao}
                    )

            return Response({'mensagem': 'Gatilhos extras importados com sucesso'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'erro': f'Erro ao processar arquivo: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ===== Usuários por Canal (Para Gestor) =====
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usuarios_por_canal(request):
    user = request.user
    canal_id = request.query_params.get('canal_id')

    if user.tipo_user != 'GESTOR':
        return Response({'detail': 'Acesso não autorizado.'}, status=403)

    if not canal_id:
        return Response({'detail': 'Parâmetro canal_id é obrigatório.'}, status=400)

    if not user.canais_venda.filter(id=canal_id).exists():
        return Response({'detail': 'Acesso negado ao canal informado.'}, status=403)

    usuarios = CustomUser.objects.filter(
        tipo_user='VENDEDOR',
        canais_venda__id=canal_id
    ).values('id', 'username', 'id_vendedor')

    return Response(usuarios)
