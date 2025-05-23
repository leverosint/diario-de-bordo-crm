import {
    AppShell,
    AppShellNavbar,
    NavLink,
    Group,
    Text,
    ScrollArea,
  } from '@mantine/core';
  import {
    LayoutDashboard,
    UserPlus,
    Upload,
    BarChart2,
    LogOut,
  } from 'lucide-react';
  import { useNavigate } from 'react-router-dom';
  
  export default function SidebarGestor({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
  
    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      navigate('/');
    };
  
    return (
      <AppShell
        navbar={{
          width: 260,
          breakpoint: 'sm',
        }}
        padding="md"
      >
        <AppShellNavbar p="xs">
          <Group justify="center" mt="xs" mb="md">
            <Text size="xl" fw={700} c="teal">
              Painel Gestor
            </Text>
          </Group>
  
          <ScrollArea>
            <NavLink
              label="Dashboard"
              leftSection={<LayoutDashboard size={18} />}
              onClick={() => navigate('/dashboard')}
            />
            <NavLink
              label="Cadastro Usuários"
              leftSection={<UserPlus size={18} />}
              onClick={() => navigate('/cadastro-usuarios')}
            />
            <NavLink
              label="Importar CSV"
              leftSection={<Upload size={18} />}
              onClick={() => navigate('/importar')}
            />
            <NavLink
              label="Relatórios"
              leftSection={<BarChart2 size={18} />}
              onClick={() => navigate('/relatorios')}
            />
            <NavLink
              label="Sair"
              leftSection={<LogOut size={18} />}
              onClick={handleLogout}
              style={{ color: 'red', marginTop: 20 }}
            />
          </ScrollArea>
        </AppShellNavbar>
  
        {children}
      </AppShell>
    );
  }
  