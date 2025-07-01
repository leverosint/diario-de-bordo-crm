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
from rest_framework import status
from .models import Interacao, Oportunidade, GatilhoExtra, Parceiro
from .serializers import InteracaoSerializer, OportunidadeSerializer
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from .serializers import UsuarioReportSerializer
from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework import generics
from .serializers import ReportParceiroSerializer
from .models import ResumoParceirosMensal
from .serializers import ResumoParceirosMensalSerializer



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
                    nome_unidade = str(row['unidade']).strip()

                    # 🔥 Busca a unidade ignorando maiúsculas/minúsculas
                    canal = CanalVenda.objects.filter(nome__iexact=nome_unidade).first()

                    if not canal:
                        # 🔥 Se não encontrar, seta para 'Canal Padrão'
                        canal, _ = CanalVenda.objects.get_or_create(nome="Canal Padrão")

                    parceiro_data = {
                        'codigo': str(row['codigo']).strip(),
                        'parceiro': str(row['parceiro']).strip(),
                        'classificacao': str(row['classificacao']).strip(),
                        'consultor': str(row['consultor']).strip(),
                        'unidade': nome_unidade,
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
                    "canais_venda": [
                        {"id": canal.id, "nome": canal.nome}
                        for canal in user.canais_venda.all()
                    ],  # 👈 Agora vem id e nome certinho!
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
        parceiro = serializer.validated_data['parceiro']
        status_no_momento = parceiro.status
        serializer.save(usuario=self.request.user, status=status_no_momento)


class InteracoesHojeView(generics.ListAPIView):
    serializer_class = InteracaoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        hoje = now().date()
        return Interacao.objects.filter(data_interacao__date=hoje, usuario=self.request.user)


from datetime import timedelta
from django.utils.timezone import now
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Parceiro, GatilhoExtra
class InteracoesPendentesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        hoje = now().date()

        # intervalo de espera em dias
        dias_espera = 7
        limite_data = hoje - timedelta(days=dias_espera)

        # filtra parceiros de acordo com o tipo de usuário
        if usuario.tipo_user == 'VENDEDOR':
            parceiros = Parceiro.objects.filter(consultor=usuario.id_vendedor)
        elif usuario.tipo_user == 'GESTOR':
            parceiros = Parceiro.objects.filter(canal_venda__in=usuario.canais_venda.all())
        else:  # ADMIN
            parceiros = Parceiro.objects.all()

        # filtros via query params
        canal_id   = request.query_params.get('canal_id')
        consultor  = request.query_params.get('consultor')
        status_p   = request.query_params.get('status')
        gatilho_p  = request.query_params.get('gatilho_extra')

        if canal_id:
            parceiros = parceiros.filter(canal_venda_id=canal_id)
        if consultor:
            parceiros = parceiros.filter(consultor=consultor)
        if status_p:
            parceiros = parceiros.filter(status=status_p)

        pendentes = []
        interagidos = []

        for parceiro in parceiros:
            # pega a última interação registrada
            ultima = parceiro.interacoes.order_by('-data_interacao').first()
            interagido_hoje = ultima and ultima.data_interacao.date() == hoje
            tinha_gatilho = bool(ultima and ultima.gatilho_extra)


            # se houver contato e estiver dentro dos últimos 7 dias, bloqueia
            bloqueado = (
                ultima
                and ultima.entrou_em_contato
                and limite_data < ultima.data_interacao.date() < hoje
            )

            # verifica gatilho manual
            if usuario.tipo_user == 'GESTOR':
                # Gestor vê QUALQUER gatilho extra do parceiro (não só os dele)
                gatilho = GatilhoExtra.objects.filter(parceiro=parceiro).first()
                gatilho = GatilhoExtra.objects.filter(parceiro=parceiro, gatilho_utilizado=False).first()

            else:
                # Vendedor só vê os próprios
                gatilho = GatilhoExtra.objects.filter(parceiro=parceiro, usuario=usuario).first()
                gatilho = GatilhoExtra.objects.filter(parceiro=parceiro, usuario=usuario, gatilho_utilizado=False).first()

                
                

            # filtro opcional de gatilho
            if gatilho_p and gatilho_p.lower() != 'todos':
                if not gatilho or gatilho.descricao.lower() != gatilho_p.lower():
                    continue

            # sempre mostra se existir gatilho ativo
            if gatilho:
                pendentes.append({
                    'id': parceiro.id,
                    'parceiro': parceiro.parceiro,
                    'unidade': parceiro.unidade,
                    'classificacao': parceiro.classificacao,
                    'status': parceiro.status,
                    'tipo': '',
                    'data_interacao': '',
                    'entrou_em_contato': False,
                    'gatilho_extra': gatilho.descricao,
                    'criador_gatilho': gatilho.usuario.username if usuario.tipo_user == 'GESTOR' else None,  # opcional, para frontend
                })

            # marca como interagidos se fez contato hoje
            if interagido_hoje:
                interagidos.append({
                    'id': parceiro.id,
                    'parceiro': parceiro.parceiro,
                    'unidade': parceiro.unidade,
                    'classificacao': parceiro.classificacao,
                    'status': parceiro.status,
                    'tipo': ultima.tipo,
                    'data_interacao': ultima.data_interacao,
                    'entrou_em_contato': ultima.entrou_em_contato,
                    'gatilho_extra': gatilho.descricao if gatilho else None,
                    'criador_gatilho': gatilho.usuario.username if (gatilho and usuario.tipo_user == 'GESTOR') else None,
                })

            # repõe em pendentes se:
            # • sem gatilho
            # • não interagiu hoje
            # • não bloqueado (<7 dias)
            # • status diferente de 'Base Ativa'
            if (
                not gatilho
                and not interagido_hoje
                and not bloqueado
                and parceiro.status != 'Base Ativa'
                    and not (tinha_gatilho and ultima and ultima.data_interacao.date() == hoje)

            ):
                pendentes.append({
                    'id': parceiro.id,
                    'parceiro': parceiro.parceiro,
                    'unidade': parceiro.unidade,
                    'classificacao': parceiro.classificacao,
                    'status': parceiro.status,
                    'tipo': '',
                    'data_interacao': '',
                    'entrou_em_contato': False,
                    'gatilho_extra': None,
                })

        # montar filtros dinâmicos
        status_unicos = sorted({item['status'] for item in pendentes})
        if usuario.tipo_user == 'GESTOR':
            gatilhos_ativos = (
                GatilhoExtra.objects.filter(
                    parceiro__canal_venda__in=usuario.canais_venda.all()
                ).values_list('descricao', flat=True).distinct()
            )
        else:
            gatilhos_ativos = (
                GatilhoExtra.objects.filter(usuario=usuario)
                .values_list('descricao', flat=True)
                .distinct()
            )

        tipo_lista = request.query_params.get('tipo', 'pendentes')
        if tipo_lista == 'interagidos':
            return Response({
                'dados': interagidos,
                'status_disponiveis': status_unicos,
                'gatilhos_disponiveis': list(gatilhos_ativos),
            })

        return Response({
            'dados': pendentes,
            'status_disponiveis': status_unicos,
            'gatilhos_disponiveis': list(gatilhos_ativos),
        })


######REGISTRARINTERACAOVIEWS)############
# ====== Interação Simples ======
class RegistrarInteracaoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            parceiro_id = request.data.get('parceiro')
            tipo = request.data.get('tipo')
            observacao = request.data.get('observacao', '')
            gatilho_extra = request.data.get('gatilho_extra', None)

            if not parceiro_id:
                return Response({'error': 'Parceiro não informado.'}, status=400)
            if not tipo:
                return Response({'error': 'Tipo de interação não informado.'}, status=400)

            parceiro = Parceiro.objects.get(id=parceiro_id)

            # Se não vier do request, tenta buscar no banco
            if not gatilho_extra:
                gatilho = GatilhoExtra.objects.filter(parceiro=parceiro, usuario=request.user).first()
                gatilho_extra = gatilho.descricao if gatilho else None
            else:
                gatilho = GatilhoExtra.objects.filter(parceiro=parceiro, usuario=request.user, descricao=gatilho_extra).first()

            # Cria interação
            interacao = Interacao.objects.create(
                parceiro=parceiro,
                usuario=request.user,
                tipo=tipo,
                entrou_em_contato=True,
                status=parceiro.status,
                gatilho_extra=gatilho_extra
            )

            if gatilho:
                gatilho.gatilho_utilizado = True
                gatilho.save()

            return Response({
                'interacao': InteracaoSerializer(interacao).data,
                'mensagem': 'Interação registrada com sucesso.'
            }, status=201)

        except Parceiro.DoesNotExist:
            return Response({'error': 'Parceiro não encontrado.'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)




# ====== Interação + Oportunidade ======
class RegistrarOportunidadeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            parceiro_id = request.data.get('parceiro')
            tipo = request.data.get('tipo')
            valor = request.data.get('valor')
            observacao = request.data.get('observacao', '')
            gatilho_extra = request.data.get('gatilho_extra', None)

            if not parceiro_id:
                return Response({'error': 'Parceiro não informado.'}, status=400)
            if not tipo:
                return Response({'error': 'Tipo de interação não informado.'}, status=400)
            if not valor:
                return Response({'error': 'Valor obrigatório para criar oportunidade.'}, status=400)

            parceiro = Parceiro.objects.get(id=parceiro_id)

            # Se não vier do request, tenta buscar no banco
            if not gatilho_extra:
                gatilho = GatilhoExtra.objects.filter(parceiro=parceiro, usuario=request.user).first()
                gatilho_extra = gatilho.descricao if gatilho else None
            else:
                gatilho = GatilhoExtra.objects.filter(parceiro=parceiro, usuario=request.user, descricao=gatilho_extra).first()

            # 🔥 Cria Interação
            interacao = Interacao.objects.create(
                parceiro=parceiro,
                usuario=request.user,
                tipo=tipo,
                entrou_em_contato=True,
                status=parceiro.status,
                gatilho_extra=gatilho_extra
            )

            # 🔥 Cria Oportunidade
            oportunidade = Oportunidade.objects.create(
                parceiro=parceiro,
                usuario=request.user,
                valor=float(valor),
                etapa='oportunidade',
                observacao=observacao,
                gatilho_extra=gatilho_extra
            )

            if gatilho:
                gatilho.gatilho_utilizado = True
                gatilho.save()

            return Response({
                'interacao': InteracaoSerializer(interacao).data,
                'oportunidade': OportunidadeSerializer(oportunidade).data,
                'mensagem': 'Interação e oportunidade registradas com sucesso.'
            }, status=201)

        except Parceiro.DoesNotExist:
            return Response({'error': 'Parceiro não encontrado.'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)




        
        
        
        
        
        

class InteracoesMetasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        hoje = now().date()

        interacoes_hoje = Interacao.objects.filter(
            usuario=usuario,
            data_interacao__date=hoje
        ).count()

        meta_diaria = 6
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
        etapa     = self.request.query_params.get('etapa')  # <- agora chama "etapa"
        status_parceiro = self.request.query_params.get('status_parceiro')  # <- novo filtro!
        gatilho   = self.request.query_params.get('gatilho')

        if canal_id:
            queryset = queryset.filter(parceiro__canal_venda_id=canal_id)
        if consultor:
            queryset = queryset.filter(parceiro__consultor=consultor)
        if etapa:
            queryset = queryset.filter(etapa=etapa)
        if status_parceiro:
            queryset = queryset.filter(parceiro__status=status_parceiro)
        if gatilho:
            queryset = queryset.filter(gatilho_extra__iexact=gatilho)

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
        consultor = request.query_params.get('consultor')  # ✅ Novo parâmetro

        # Data do mês filtrado
        data_inicio = make_aware(datetime(ano, mes, 1))
        if mes == 12:
            data_fim = make_aware(datetime(ano + 1, 1, 1))
        else:
            data_fim = make_aware(datetime(ano, mes + 1, 1))

        # ========= 1. Filtrar parceiros ========= #
        parceiros_vivos = Parceiro.objects.all()

        if user.tipo_user == 'GESTOR':
            parceiros_vivos = parceiros_vivos.filter(canal_venda__in=user.canais_venda.all())
        elif user.tipo_user == 'VENDEDOR':
            parceiros_vivos = parceiros_vivos.filter(consultor=user.id_vendedor)

        # ✅ Filtro adicional por consultor
        if consultor:
            parceiros_vivos = parceiros_vivos.filter(consultor=consultor)

        interacoes = Interacao.objects.filter(parceiro__in=parceiros_vivos, data_interacao__range=(data_inicio, data_fim))
        oportunidades = Oportunidade.objects.filter(parceiro__in=parceiros_vivos, data_criacao__range=(data_inicio, data_fim))

        # ========= Status counts ========= #
        status_counts = {
            'Sem Faturamento': parceiros_vivos.filter(status='Sem Faturamento').count(),
            'Base Ativa': parceiros_vivos.filter(status='Base Ativa').count(),
            '30 dias s/ Fat': parceiros_vivos.filter(status='30 dias s/ Fat').count(),
            '60 dias s/ Fat': parceiros_vivos.filter(status='60 dias s/ Fat').count(),
            '90 dias s/ Fat': parceiros_vivos.filter(status='90 dias s/ Fat').count(),
            '120 dias s/ Fat': parceiros_vivos.filter(status='120 dias s/ Fat').count(),
        }

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

        interacoes_por_status = (
            interacoes.values('status')
            .annotate(total=Count('id'))
        )
        interacoes_status_dict = {
            item['status'] or 'Sem Status': item['total']
            for item in interacoes_por_status
        }

        primeiras_interacoes = (
            interacoes.order_by('parceiro_id', 'data_interacao')
            .distinct('parceiro_id')
        )
        parceiros_contatados_status = defaultdict(int)
        for interacao in primeiras_interacoes:
            status = interacao.status or 'Sem Status'
            parceiros_contatados_status[status] += 1

        # IDs com interação no período
        ids_com_interacao = set(interacoes.values_list('parceiro_id', flat=True).distinct())

        # Lista de parceiros com flag tem_interacao
        parceiros_serializados = []
        for parceiro in parceiros_vivos:
            tem_interacao = parceiro.id in ids_com_interacao
            parceiro_data = ParceiroSerializer(parceiro).data
            parceiro_data['tem_interacao'] = tem_interacao
            parceiros_serializados.append(parceiro_data)

        return Response({
            "kpis": kpis,
            "interacoes_status": interacoes_status_dict,
            "parceiros_contatados_status": parceiros_contatados_status,
            "parceiros": parceiros_serializados
        })

      


# ==== Funil de Conversão =====
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
            {"name": "Perdidas", "value": oportunidades.filter(etapa='aguardando').count()},
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
        
        # ===== Resumo Parceiros Mensal (Materialized) =====
class ResumoParceirosMensalListView(generics.ListAPIView):
    serializer_class = ResumoParceirosMensalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ResumoParceirosMensal.objects.all()
        mes = self.request.query_params.get('mes')
        ano = self.request.query_params.get('ano')
        consultor = self.request.query_params.get('consultor')
        
        if mes and ano:
            qs = qs.filter(data_ref__month=int(mes), data_ref__year=int(ano))
        if consultor:
            qs = qs.filter(consultor=consultor)
        return qs
        
        
        
        

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

########GATILHO MANUAL#########

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def criar_gatilho_manual(request):
    parceiro_id = request.data.get('parceiro')
    descricao = request.data.get('descricao')

    if not parceiro_id or not descricao:
        return Response(
            {'erro': 'Parâmetros \"parceiro\" e \"descricao\" são obrigatórios.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        parceiro = Parceiro.objects.get(id=int(parceiro_id))
    except Parceiro.DoesNotExist:
        return Response(
            {'erro': 'Parceiro não encontrado.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # ✅ Buscar o vendedor do parceiro
    usuario = CustomUser.objects.filter(id_vendedor=parceiro.consultor).first()
    if not usuario:
        return Response({'erro': 'Consultor (vendedor) não encontrado para este parceiro.'}, status=400)

    # ✅ Criar o gatilho extra vinculado ao vendedor
    gatilho, _ = GatilhoExtra.objects.update_or_create(
        parceiro=parceiro,
        usuario=usuario,
        defaults={'descricao': descricao}
    )

    return Response(
        {'mensagem': 'Gatilho criado com sucesso e vinculado ao vendedor responsável.'},
        status=status.HTTP_201_CREATED
    )
    
    
    
    

class AlterarSenhaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        senha_atual = request.data.get('senha_atual')
        nova_senha = request.data.get('nova_senha')

        if not senha_atual or not nova_senha:
            return Response({'erro': 'Senha atual e nova senha são obrigatórias.'}, status=400)

        if not user.check_password(senha_atual):
            return Response({'erro': 'Senha atual incorreta.'}, status=400)

        user.set_password(nova_senha)
        user.save()

        return Response({'mensagem': 'Senha alterada com sucesso.'}, status=200)

    
    
class SolicitarResetSenhaView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response({'erro': 'E-mail é obrigatório.'}, status=400)

        try:
            user = User.objects.get(email__iexact=email)  # 🔥 Aqui corrige caixa alta/baixa
        except User.DoesNotExist:
            return Response({'erro': 'Usuário não encontrado com esse e-mail.'}, status=404)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        link = f"{settings.FRONTEND_URL}/resetar-senha/{uid}/{token}"

        send_mail(
            subject='Recuperação de Senha - Diário de Bordo',
            message=f'Olá {user.username},\n\nClique no link abaixo para redefinir sua senha:\n\n{link}\n\nSe não solicitou, ignore este e-mail.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

        return Response({'mensagem': 'E-mail de recuperação enviado com sucesso.'}, status=200)




class ResetSenhaConfirmarView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        nova_senha = request.data.get('nova_senha')

        if not nova_senha:
            return Response({'erro': 'Nova senha é obrigatória.'}, status=400)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({'erro': 'Link inválido.'}, status=400)

        if not default_token_generator.check_token(user, token):
            return Response({'erro': 'Token inválido ou expirado.'}, status=400)

        user.set_password(nova_senha)
        user.save()

        return Response({'mensagem': 'Senha alterada com sucesso.'}, status=200)

User = get_user_model()

class UsuarioReportView(generics.ListAPIView):
    """
    Lista todos os usuários com id + nome, para uso em selects ou relatórios.
    """
    queryset = User.objects.all()  # ou filtrar apenas vendedores: .filter(tipo_user='VENDEDOR')
    serializer_class = UsuarioReportSerializer
    permission_classes = [IsAuthenticated]



class ParceiroReportView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = ReportParceiroSerializer

    def get_queryset(self):
        user = self.request.user
        if user.tipo_user == 'ADMIN':
            return Parceiro.objects.all()
        elif user.tipo_user == 'GESTOR':
            return Parceiro.objects.filter(canal_venda__in=user.canais_venda.all())
        elif user.tipo_user == 'VENDEDOR':
            return Parceiro.objects.filter(consultor=user.id_vendedor)
        return Parceiro.objects.none()