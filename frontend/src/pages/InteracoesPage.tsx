import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Interacoes from './Interacoes';
import SidebarGestor from '../components/SidebarGestor';

export default function InteracoesPage() {
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
      <Interacoes />
    </SidebarGestor>
  );
}
