import SidebarGestor from '../components/SidebarGestor';
import CadastroUsuarios from '../components/CadastroParceiro';

export default function CadastroUsuariosPage() {
  return (
    <SidebarGestor tipoUser="GESTOR">
      <CadastroUsuarios />
    </SidebarGestor>
  );
}
