import SidebarGestor from '../components/SidebarGestor';
import CadastroParceiro from '../components/CadastroParceiro';

export default function CadastroParceiroPage() {
  return (
    <SidebarGestor tipoUser="GESTOR">
      <CadastroParceiro />
    </SidebarGestor>
  );
}
