from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView,
    ParceiroCreateUpdateView,
    UploadParceirosView,
    ParceiroViewSet,
    CanalVendaViewSet,
)

router = DefaultRouter()
router.register(r'parceiros-list', ParceiroViewSet, basename='parceiros')
router.register(r'canais-venda', CanalVendaViewSet, basename='canais-venda')

urlpatterns = [
    path('login/', LoginView.as_view()),
    path('parceiros/', ParceiroCreateUpdateView.as_view()),  # criação manual
    path('upload-parceiros/', UploadParceirosView.as_view({'post': 'create'})),  # via Excel
    path('', include(router.urls)),  # <-- adiciona os ViewSets
]

from django.urls import path
from .views import (
    InteracoesHojeView,
    InteracoesPendentesView,
    HistoricoInteracoesView,
    RegistrarInteracaoView,
)

urlpatterns += [
    path('interacoes/hoje/', InteracoesHojeView.as_view(), name='interacoes-hoje'),
    path('interacoes/pendentes/', InteracoesPendentesView.as_view(), name='interacoes-pendentes'),
    path('interacoes/historico/', HistoricoInteracoesView.as_view(), name='interacoes-historico'),
    path('interacoes/registrar/', RegistrarInteracaoView.as_view(), name='registrar-interacao'),
]
