import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');

    if (!token || !usuario) {
      navigate('/login'); // Se não tiver login, redireciona
    }
  }, []);
}
