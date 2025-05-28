from django.urls import path, include 
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView,
    ParceiroCreateUpdateView,
    UploadParceirosView,
    ParceiroViewSet,
    CanalVendaViewSet,
    InteracaoViewSet,
    InteracoesHojeView,
    InteracoesPendentesView,
    HistoricoInteracoesView,
    RegistrarInteracaoView,
    InteracoesMetasView,  # ✅ Importação correta
)

# ROTAS DO ROUTER
router = DefaultRouter()
router.register(r'parceiros-list', ParceiroViewSet, basename='parceiros')
router.register(r'canais-venda', CanalVendaViewSet, basename='canais-venda')
# A linha abaixo foi removida para evitar conflito
# router.register(r'interacoes', InteracaoViewSet, basename='interacoes')

# URLPATTERNS PRINCIPAIS
urlpatterns = [
    path('login/', LoginView.as_view()),
    path('parceiros/', ParceiroCreateUpdateView.as_view()),  # criação manual
    path('upload-parceiros/', UploadParceirosView.as_view({'post': 'create'})),  # via Excel
    path('', include(router.urls)),  # inclui todos os ViewSets acima

    # ✅ Corrigido: view correta para metas
    path('interacoes/pendentes/metas/', InteracoesMetasView.as_view(), name='interacoes-metas'),
]

# VIEWS ADICIONAIS ESPECÍFICAS DE INTERAÇÃO
urlpatterns += [
    # Rotas específicas para o InteracaoViewSet
    path('interacoes/', InteracaoViewSet.as_view({'get': 'list', 'post': 'create'}), name='interacoes-list'),
    path('interacoes/<int:pk>/', InteracaoViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='interacoes-detail'),
    path('interacoes/exportar-excel/', InteracaoViewSet.as_view({'get': 'exportar_excel'}), name='interacoes-exportar'),

    # Rotas específicas para as outras views de interação
    path('interacoes/hoje/', InteracoesHojeView.as_view(), name='interacoes-hoje'),
    path('interacoes/pendentes/', InteracoesPendentesView.as_view(), name='interacoes-pendentes'),
    path('interacoes/historico/', HistoricoInteracoesView.as_view(), name='interacoes-historico'),
    path('interacoes/registrar/', RegistrarInteracaoView.as_view(), name='registrar-interacao'),
]
