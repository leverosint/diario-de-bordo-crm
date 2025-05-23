import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarGestor from '../components/SidebarGestor';

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const tipoUser = usuario?.tipo_user;

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);

  if (!token) return null;

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
