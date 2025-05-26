from django.urls import path
from .views import LoginView, ParceiroCreateUpdateView, UploadParceirosView

urlpatterns = [
    path('login/', LoginView.as_view()),
    path('parceiros/', ParceiroCreateUpdateView.as_view()),
    path('upload-parceiros/', UploadParceirosView.as_view()),
]
