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

        user = (
            CustomUser.objects.filter(username=identificador).first() or
            CustomUser.objects.filter(email=identificador).first()
        )

        # Se ainda não achou e for número, tenta id_vendedor
        if not user and identificador and identificador.isdigit():
            user = CustomUser.objects.filter(id_vendedor=int(identificador)).first()

        if user and user.check_password(senha) and user.is_active:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'usuario': {
                    'username': user.username,
                    'email': user.email,
                    'tipo_user': user.tipo_user,
                    'canais_venda': [canal.nome for canal in user.canais_venda.all()],
                    'id_vendedor': user.id_vendedor,
                    'primeiro_acesso': user.primeiro_acesso,
                }
            })

        return Response({'erro': 'Credenciais inválidas'}, status=status.HTTP_401_UNAUTHORIZED)



def ping(request):
    return JsonResponse({'status': 'ok'})
