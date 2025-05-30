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
    OportunidadeViewSet,  # 🚀 ViewSet Oportunidade
)

# ROTAS DO ROUTER
router = DefaultRouter()
router.register(r'parceiros-list', ParceiroViewSet, basename='parceiros')
router.register(r'canais-venda', CanalVendaViewSet, basename='canais-venda')
router.register(r'oportunidades', OportunidadeViewSet, basename='oportunidades')  # 🚀 Nova rota para Oportunidades

# URLPATTERNS PRINCIPAIS
urlpatterns = [
    path('login/', LoginView.as_view()),
        path('upload-parceiros/', UploadParceirosView.as_view({'post': 'create'})),  # Upload via Excel
    path('', include(router.urls)),  # Inclui todas as rotas dos ViewSets acima
]

# VIEWS ADICIONAIS ESPECÍFICAS
urlpatterns += [
    # Rotas específicas para o InteracaoViewSet (sem usar o router, pois são personalizadas)
    path('interacoes/', InteracaoViewSet.as_view({'get': 'list', 'post': 'create'}), name='interacoes-list'),
    path('interacoes/<int:pk>/', InteracaoViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='interacoes-detail'),

    # Rotas específicas para outras views
    path('interacoes/pendentes/', InteracoesPendentesView.as_view(), name='interacoes-pendentes'),
    path('interacoes/pendentes/metas/', InteracoesMetasView.as_view(), name='interacoes-metas'),
    path('interacoes/hoje/', InteracoesHojeView.as_view(), name='interacoes-hoje'),
    path('interacoes/historico/', HistoricoInteracoesView.as_view(), name='interacoes-historico'),
    path('interacoes/registrar/', RegistrarInteracaoView.as_view(), name='registrar-interacao'),
]
