import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarGestor from '../components/SidebarGestor';

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);

  if (!token) return null;

  return (
    <SidebarGestor>
      <div style={{ padding: 20 }}>
        <h1>
          {usuario?.tipo_user === 'GESTOR' && 'Área do Gestor'}
          {usuario?.tipo_user === 'VENDEDOR' && 'Área do Vendedor'}
          {usuario?.tipo_user === 'ADMIN' && 'Área do Administrador'}
        </h1>
        <p>Use o menu lateral para navegar pelas funcionalidades.</p>
      </div>
    </SidebarGestor>
  );
}
