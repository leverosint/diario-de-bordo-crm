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
  MessageCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';


interface SidebarProps {
  children: React.ReactNode;
  tipoUser: string;
}

export default function SidebarGestor({ children, tipoUser }: SidebarProps) {
  const navigate = useNavigate();
  const [opened, setOpened] = useState(true);
  const nomeUsuario = JSON.parse(localStorage.getItem('usuario') || '{}')?.username || 'Usuário';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  };

  return (
    <AppShell
      padding={0} // ✅ Sem padding global
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened, desktop: !opened },
      }}
      header={{ height: 60 }}
      styles={{
        main: {
          paddingLeft: opened ? 260 : 60, // ✅ Ajusta o conteúdo baseado na sidebar
          transition: 'padding-left 0.3s ease',
        },
      }}
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
              Painel Diário de Bordo
            </Text>
          </Group>
        </Group>
      </AppShellHeader>

      <AppShellNavbar p="xs" style={{ display: 'flex', flexDirection: 'column' }}>
        <Group justify="center" mt="xs" mb="md">
          <Text size="xl" fw={700} c="teal">
            Olá, {nomeUsuario}
          </Text>
        </Group>

        <ScrollArea style={{ flex: 1 }}>
          <NavLink
            label="Dashboard"
            leftSection={<LayoutDashboard size={18} />}
            onClick={() => navigate('/dashboard')}
          />

          <NavLink
            label="Interações"
            leftSection={<MessageCircle size={18} />}
            onClick={() => navigate('/interacoes')}
          />

        <NavLink
          label="Tabela Oportunidades"
          leftSection={<BarChart2 size={18} />}
          onClick={() => navigate('/tabela-oportunidades')}
          />

          

          {(tipoUser === 'GESTOR' || tipoUser === 'ADMIN') && (
            <>
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
            </>
          )}

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

      <AppShellMain>
        {children}
      </AppShellMain>
    </AppShell>
  );
}
