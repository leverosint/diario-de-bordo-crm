from django.urls import path, include
from rest_framework.routers import DefaultRouter
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
    InteracoesMetasView,
    OportunidadeViewSet,
    DashboardKPIView,
    DashboardFunilView,
    DashboardOportunidadesMensaisView,
    UploadGatilhosExtrasView,
    usuarios_por_canal
)

# ROTAS DO ROUTER
router = DefaultRouter()
router.register(r'parceiros-list', ParceiroViewSet, basename='parceiros')
router.register(r'canais-venda', CanalVendaViewSet, basename='canais-venda')
router.register(r'oportunidades', OportunidadeViewSet, basename='oportunidades')

# URLPATTERNS PRINCIPAIS
urlpatterns = [
    # Autenticação e Uploads
    path('login/', LoginView.as_view(), name='login'),
    path('upload-parceiros/', UploadParceirosView.as_view({'post': 'create'}), name='upload-parceiros'),
    path('upload-gatilhos/', UploadGatilhosExtrasView.as_view({'post': 'create'}), name='upload-gatilhos'),

    # Inclusão de rotas do router
    path('', include(router.urls)),

    # Interações
    path('interacoes/', InteracaoViewSet.as_view({'get': 'list', 'post': 'create'}), name='interacoes-list'),
    path('interacoes/<int:pk>/', InteracaoViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='interacoes-detail'),
    path('interacoes/pendentes/', InteracoesPendentesView.as_view(), name='interacoes-pendentes'),
    path('interacoes/pendentes/metas/', InteracoesMetasView.as_view(), name='interacoes-metas'),
    path('interacoes/hoje/', InteracoesHojeView.as_view(), name='interacoes-hoje'),
    path('interacoes/historico/', HistoricoInteracoesView.as_view(), name='interacoes-historico'),
    path('interacoes/registrar/', RegistrarInteracaoView.as_view(), name='registrar-interacao'),

    # Dashboard
    path('dashboard/kpis/', DashboardKPIView.as_view(), name='dashboard-kpis'),
    path('dashboard/funil/', DashboardFunilView.as_view(), name='dashboard-funil'),
    path('dashboard/oportunidades-mensais/', DashboardOportunidadesMensaisView.as_view(), name='dashboard-oportunidades-mensais'),

    # Outros
    path('usuarios-por-canal/', usuarios_por_canal, name='usuarios-por-canal'),
]
