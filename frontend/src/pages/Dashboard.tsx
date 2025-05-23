import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarGestor from '../components/SidebarGestor';

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const tipo = usuario?.tipo_user;

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);

  if (!token) return null;

  return (
    <SidebarGestor>
      <div style={{ padding: 20 }}>
        {tipo === 'GESTOR' && (
          <>
            <h1>Área do Gestor</h1>
            <p>Use o menu lateral para navegar pelas funcionalidades.</p>
          </>
        )}

        {tipo === 'VENDEDOR' && (
          <>
            <h1>Área do Vendedor</h1>
            <p>Bem-vindo! Aqui você encontrará seus clientes e metas.</p>
          </>
        )}

        {tipo === 'ADMIN' && (
          <>
            <h1>Área do Administrador</h1>
            <p>Gerencie usuários, permissões e configurações do sistema.</p>
          </>
        )}
      </div>
    </SidebarGestor>
  );
}
