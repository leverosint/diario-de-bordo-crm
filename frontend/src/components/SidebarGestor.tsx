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
  Button,
  rem,
} from '@mantine/core';
import {
  LayoutDashboard,
  UserPlus,
  Upload,
  BarChart2,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {ChevronRight } from 'lucide-react';


const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
const nome = usuario?.username || 'Usuário';

export default function SidebarGestor({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [opened, setOpened] = useState(true);

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
        collapsed: { mobile: !opened, desktop: !opened },
      }}
      header={{ height: 60 }}
    >
      <AppShellHeader withBorder={false} style={{ background: '#005A64' }}>
        <Group h="100%" px="md" justify="space-between">
          <Group>
          <Button
        variant="subtle"
        color="white"
        onClick={() => setOpened((o) => !o)}
        style={{ padding: 0 }}
      >
        {opened ? <ChevronLeft size={20} color="white" /> : <ChevronRight size={20} color="white" />}
      </Button>
            <Text size="lg" fw={700} c="white">
              Painel Gestor
            </Text>
          </Group>
        </Group>
      </AppShellHeader>

      <AppShellNavbar
        p="xs"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <Group justify="center" mt="xs" mb="md">
          <Text size="xl" fw={700} c="teal">
            Olá, {nome}
          </Text>
        </Group>

        <ScrollArea style={{ flex: 1 }}>
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

        <Group justify="center" mt="auto" mb="md">
          <Button
            variant="light"
            size="xs"
            color="#005A64"
            onClick={() => setOpened(false)}
            leftSection={<ChevronLeft size={16} />}
          >
            Recolher
          </Button>
        </Group>
      </AppShellNavbar>

      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
