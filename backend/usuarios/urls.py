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
    RegistrarOportunidadeView,  # 🔥 ADICIONA AQUI
    InteracoesMetasView,
    OportunidadeViewSet,
    DashboardKPIView,
    DashboardFunilView,
    DashboardOportunidadesMensaisView,
)

# ROTAS DO ROUTER
router = DefaultRouter()
router.register(r'parceiros-list', ParceiroViewSet, basename='parceiros')
router.register(r'canais-venda', CanalVendaViewSet, basename='canais-venda')
router.register(r'oportunidades', OportunidadeViewSet, basename='oportunidades')

# URLPATTERNS PRINCIPAIS
urlpatterns = [
    path('login/', LoginView.as_view()),
    path('upload-parceiros/', UploadParceirosView.as_view({'post': 'create'})),
    path('', include(router.urls)),
]

# VIEWS ADICIONAIS
urlpatterns += [
    path('interacoes/', InteracaoViewSet.as_view({'get': 'list', 'post': 'create'}), name='interacoes-list'),
    path('interacoes/<int:pk>/', InteracaoViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='interacoes-detail'),

    path('interacoes/pendentes/', InteracoesPendentesView.as_view(), name='interacoes-pendentes'),
    path('interacoes/pendentes/metas/', InteracoesMetasView.as_view(), name='interacoes-metas'),
    path('interacoes/hoje/', InteracoesHojeView.as_view(), name='interacoes-hoje'),
    path('interacoes/historico/', HistoricoInteracoesView.as_view(), name='interacoes-historico'),
    path('interacoes/registrar/', RegistrarInteracaoView.as_view(), name='registrar-interacao'),
    path('oportunidades/registrar/', RegistrarOportunidadeView.as_view(), name='registrar-oportunidade'),  # 🔥 ADICIONA ESSA LINHA AQUI

    path('dashboard/kpis/', DashboardKPIView.as_view(), name='dashboard-kpis'),
    path('dashboard/funil/', DashboardFunilView.as_view(), name='dashboard-funil'),
    path('dashboard/oportunidades-mensais/', DashboardOportunidadesMensaisView.as_view(), name='dashboard-oportunidades-mensais'),
]

from .views import UploadGatilhosExtrasView

urlpatterns += [
    path('upload-gatilhos/', UploadGatilhosExtrasView.as_view({'post': 'create'}), name='upload-gatilhos'),
]

from .views import usuarios_por_canal

urlpatterns += [
    path('usuarios-por-canal/', usuarios_por_canal, name='usuarios-por-canal'),
]

from .views import criar_gatilho_manual

urlpatterns += [
    path('criar-gatilho-manual/', criar_gatilho_manual, name='criar-gatilho-manual'),
]
