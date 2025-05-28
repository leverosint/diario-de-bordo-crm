// src/pages/InteracoesPage.tsx
import SidebarGestor from '../components/SidebarGestor';
import Interacoes from './Interacoes';

export default function InteracoesPage() {
  const tipoUser = JSON.parse(localStorage.getItem('usuario') || '{}')?.tipo_user || 'VENDEDOR';
  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Interacoes />
    </SidebarGestor>
  );
}
