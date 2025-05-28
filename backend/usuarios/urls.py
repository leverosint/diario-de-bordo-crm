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
)

# ROTAS DO ROUTER
router = DefaultRouter()
router.register(r'parceiros-list', ParceiroViewSet, basename='parceiros')
router.register(r'canais-venda', CanalVendaViewSet, basename='canais-venda')
# Remova esta linha para evitar conflito
# router.register(r'interacoes', InteracaoViewSet, basename='interacoes')

# URLPATTERNS PRINCIPAIS
urlpatterns = [
    path('login/', LoginView.as_view()),
    path('parceiros/', ParceiroCreateUpdateView.as_view()),  # criação manual
    path('upload-parceiros/', UploadParceirosView.as_view({'post': 'create'})),  # via Excel
    path('', include(router.urls)),  # inclui todos os ViewSets acima
]

# VIEWS ADICIONAIS ESPECÍFICAS DE INTERAÇÃO
urlpatterns += [
    path('interacoes/', InteracaoViewSet.as_view({'get': 'list', 'post': 'create'}), name='interacoes-list'),
    path('interacoes/<int:pk>/', InteracaoViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='interacoes-detail'),
    path('interacoes/exportar-excel/', InteracaoViewSet.as_view({'get': 'exportar_excel'}), name='interacoes-exportar'),
    path('interacoes/hoje/', InteracoesHojeView.as_view(), name='interacoes-hoje'),
    path('interacoes/pendentes/', InteracoesPendentesView.as_view(), name='interacoes-pendentes'),
    path('interacoes/historico/', HistoricoInteracoesView.as_view(), name='interacoes-historico'),
    path('interacoes/registrar/', RegistrarInteracaoView.as_view(), name='registrar-interacao'),
]
