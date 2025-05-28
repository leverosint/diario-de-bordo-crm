from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView,
    ParceiroCreateUpdateView,
    UploadParceirosView,
    ParceiroViewSet,
    CanalVendaViewSet,
       InteracoesHojeView,
    InteracoesPendentesView,
    HistoricoInteracoesView,
    RegistrarInteracaoView,
)

# ROTAS DO ROUTER
router = DefaultRouter()
router.register(r'parceiros-list', ParceiroViewSet, basename='parceiros')
router.register(r'canais-venda', CanalVendaViewSet, basename='canais-venda')
router.register(r'interacoes', InteracaoViewSet, basename='interacoes')  # ✅ REGISTRO DO VIEWSET

# URLPATTERNS PRINCIPAIS
urlpatterns = [
    path('login/', LoginView.as_view()),
    path('parceiros/', ParceiroCreateUpdateView.as_view()),  # criação manual
    path('upload-parceiros/', UploadParceirosView.as_view({'post': 'create'})),  # via Excel
    path('', include(router.urls)),  # inclui todos os ViewSets acima
]

# VIEWS ADICIONAIS ESPECÍFICAS DE INTERAÇÃO
urlpatterns += [
    path('interacoes/hoje/', InteracoesHojeView.as_view(), name='interacoes-hoje'),
    path('interacoes/pendentes/', InteracoesPendentesView.as_view(), name='interacoes-pendentes'),
    path('interacoes/historico/', HistoricoInteracoesView.as_view(), name='interacoes-historico'),
    path('interacoes/registrar/', RegistrarInteracaoView.as_view(), name='registrar-interacao'),
]
