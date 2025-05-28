// src/pages/InteracoesPage.tsx
import Interacoes from './Interacoes';
import SidebarGestor from '../components/SidebarGestor';

export default function InteracoesPage() {
  const tipoUser = JSON.parse(localStorage.getItem('usuario') || '{}')?.tipo_user || 'VENDEDOR';

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Interacoes />
    </SidebarGestor>
  );
}
