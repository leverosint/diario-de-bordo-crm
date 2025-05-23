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

  if (usuario?.tipo_user === 'GESTOR') {
    return (
      <SidebarGestor>
        <div style={{ padding: 20 }}>
          <h1>Área do Gestor</h1>
          <p>Use o menu lateral para navegar pelas funcionalidades.</p>
        </div>
      </SidebarGestor>
    );
  }

  if (usuario?.tipo_user === 'VENDEDOR') {
    return <TelaVendedor />;
  }

  if (usuario?.tipo_user === 'ADMIN') {
    return <TelaAdmin />;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Bem-vindo ao Dashboard</h1>
      <p>Sua área personalizada de indicadores e ações.</p>
    </div>
  );
}

// Telas alternativas
function TelaVendedor() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Área do Vendedor</h1>
      <p>Bem-vindo! Aqui você encontrará seus clientes e metas.</p>
    </div>
  );
}

function TelaAdmin() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Área do Administrador</h1>
      <p>Gerencie usuários, permissões e configurações do sistema.</p>
    </div>
  );
}
