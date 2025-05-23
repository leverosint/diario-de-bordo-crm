import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarGestor from '../components/SidebarGestor';

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  useEffect(() => {
    if (!token) {
      navigate('/'); // Redireciona se não estiver logado
    }
  }, [token, navigate]);

  if (!token) return null;

  // Renderiza a tela do GESTOR
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

  // Renderiza a tela para demais usuários (VENDEDOR, ADMIN etc.)
  return (
    <div style={{ padding: 40 }}>
      <h1>Bem-vindo ao Dashboard</h1>
      <p>Sua área personalizada de indicadores e ações.</p>
    </div>
  );
}