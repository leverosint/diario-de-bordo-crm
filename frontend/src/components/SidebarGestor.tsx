import { useState } from 'react';
import {
  AppShell,
  AppShellNavbar,
  AppShellHeader,
  AppShellMain,
  NavLink,
  Group,
  Text,
  ScrollArea,
  Burger,
  rem,
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
  const [opened, setOpened] = useState(true); // controla visibilidade da sidebar

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  };

  return (
    <AppShell
      padding="md"
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened, desktop: !opened }, // <- recolhe para todos
      }}
      header={{ height: 60 }}
    >
      <AppShellHeader withBorder={false} style={{ background: '#005A64' }}>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              size="sm"
              color="white"
            />
            <Text size="lg" fw={700} c="white">
              Painel Gestor
            </Text>
          </Group>
        </Group>
      </AppShellHeader>

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
            style={{ color: 'red', marginTop: rem(20) }}
          />
        </ScrollArea>
      </AppShellNavbar>

      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
