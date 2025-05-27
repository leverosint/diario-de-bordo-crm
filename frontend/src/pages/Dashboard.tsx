import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarGestor from '../components/SidebarGestor';

export default function Dashboard() {
  const navigate = useNavigate();
  const [tipoUser, setTipoUser] = useState<string | null>(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '');
      if (!usuario?.tipo_user) {
        navigate('/');
        return;
      }
      setTipoUser(usuario.tipo_user);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      navigate('/');
    }
  }, [token, navigate]);

  if (!token || !tipoUser) return null;

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <div style={{ padding: 20 }}>
        <h1>
          {tipoUser === 'GESTOR' && 'Área do Gestor'}
          {tipoUser === 'VENDEDOR' && 'Área do Vendedor'}
          {tipoUser === 'ADMIN' && 'Área do Administrador'}
        </h1>
        <p>Use o menu lateral para navegar pelas funcionalidades.</p>
      </div>
    </SidebarGestor>
  );
}
