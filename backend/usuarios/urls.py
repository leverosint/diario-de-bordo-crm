from django.urls import path
from .views import LoginView, ping

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('ping/', ping, name='ping'),  # ← novo endpoint de teste
]
