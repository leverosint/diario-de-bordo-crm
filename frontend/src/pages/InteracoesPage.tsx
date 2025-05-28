// src/pages/InteracoesPage.tsx
import Interacoes from './Interacoes';
import SidebarGestor from '../components/SidebarGestor';

const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
const tipoUser = usuario?.tipo_user || 'VENDEDOR';

export default function InteracoesPage() {
  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Interacoes />
    </SidebarGestor>
  );
}
