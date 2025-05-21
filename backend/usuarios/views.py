from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from usuarios.models import CustomUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import JsonResponse  # ← traga para o topo junto

class LoginView(APIView):
    def post(self, request):
        identificador = request.data.get('identificador')
        senha = request.data.get('senha')

        try:
            user = (
                CustomUser.objects.filter(username=identificador).first() or
                CustomUser.objects.filter(email=identificador).first() or
                CustomUser.objects.filter(id_vendedor=identificador).first()
            )
        except CustomUser.DoesNotExist:
            return Response({'erro': 'Usuário não encontrado.'}, status=status.HTTP_401_UNAUTHORIZED)

        if user and user.check_password(senha):
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'usuario': {
                    'username': user.username,
                    'email': user.email,
                    'tipo_user': user.tipo_user,
                    'canal': user.canal,
                    'id_vendedor': user.id_vendedor,
                    'primeiro_acesso': user.primeiro_acesso,
                }
            })

        return Response({'erro': 'Credenciais inválidas'}, status=status.HTTP_401_UNAUTHORIZED)


def ping(request):
    return JsonResponse({'status': 'ok'})
