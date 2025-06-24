from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParceiroReportView
from .views import (
    LoginView,
    UploadParceirosView,
    ParceiroViewSet,
    CanalVendaViewSet,
    InteracaoViewSet,
    InteracoesHojeView,
    InteracoesPendentesView,
    HistoricoInteracoesView,
    RegistrarInteracaoView,
    RegistrarOportunidadeView,
    InteracoesMetasView,
    OportunidadeViewSet,
    DashboardKPIView,
    DashboardFunilView,
    DashboardOportunidadesMensaisView,
    UploadGatilhosExtrasView,
    usuarios_por_canal,
    criar_gatilho_manual,
    AlterarSenhaView,
    SolicitarResetSenhaView, 
    ResetSenhaConfirmarView,
    UsuarioReportView,  # ← adicione esta linha
    
    
)

# 🔗 ROTAS DO ROUTER
router = DefaultRouter()
router.register(r'parceiros-list', ParceiroViewSet, basename='parceiros')
router.register(r'canais-venda', CanalVendaViewSet, basename='canais-venda')
router.register(r'oportunidades', OportunidadeViewSet, basename='oportunidades')

# 🔥 URLPATTERNS FINAL CORRETO
urlpatterns = [
    # Auth
    path('login/', LoginView.as_view(), name='login'),
    path('alterar-senha/', AlterarSenhaView.as_view(), name='alterar-senha'),
    path('solicitar-reset-senha/', SolicitarResetSenhaView.as_view(), name='solicitar-reset-senha'),
    path('reset-senha-confirmar/<uidb64>/<token>/', ResetSenhaConfirmarView.as_view(), name='reset-senha-confirmar'),

    # Uploads
    path('upload-parceiros/', UploadParceirosView.as_view({'post': 'create'})),
    path('upload-gatilhos/', UploadGatilhosExtrasView.as_view({'post': 'create'})),

    # Gatilho manual e usuários
    path('criar-gatilho-manual/', criar_gatilho_manual, name='criar-gatilho-manual'),
    path('usuarios-por-canal/', usuarios_por_canal, name='usuarios-por-canal'),

    # Dashboard
    path('dashboard/kpis/', DashboardKPIView.as_view(), name='dashboard-kpis'),
    path('dashboard/funil/', DashboardFunilView.as_view(), name='dashboard-funil'),
    path('dashboard/oportunidades-mensais/', DashboardOportunidadesMensaisView.as_view(), name='dashboard-oportunidades-mensais'),

    # Interações
    path('interacoes/', InteracaoViewSet.as_view({'get': 'list', 'post': 'create'}), name='interacoes-list'),
    path('interacoes/<int:pk>/', InteracaoViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='interacoes-detail'),
    path('interacoes/pendentes/', InteracoesPendentesView.as_view(), name='interacoes-pendentes'),
    path('interacoes/pendentes/metas/', InteracoesMetasView.as_view(), name='interacoes-metas'),
    path('interacoes/hoje/', InteracoesHojeView.as_view(), name='interacoes-hoje'),
    path('interacoes/historico/', HistoricoInteracoesView.as_view(), name='interacoes-historico'),
    path('interacoes/registrar/', RegistrarInteracaoView.as_view(), name='registrar-interacao'),

    # Oportunidades
    path('oportunidades/registrar/', RegistrarOportunidadeView.as_view(), name='registrar-oportunidade'),



# relatório de usuários (id + nome)
path('usuarios/report/', UsuarioReportView.as_view(), name='usuarios-report'),

 # Relatório de usuários
    path('relatorios/usuarios/', UsuarioReportView.as_view(), name='relatorio-usuarios'),

    # relatório “apenas parceiros” com consultor_id
    path('relatorios/parceiros/', ParceiroReportView.as_view(), name='relatorio-parceiros'),


    # Inclui routers (parceiros, canais, oportunidades)
    path('', include(router.urls)),
]
