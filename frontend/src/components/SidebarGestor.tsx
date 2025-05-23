import { useState } from 'react';
import {
  AppShell,
  AppShellNavbar,
  AppShellHeader,
  AppShellMain,
  Burger,
  Group,
  Text,
  UnstyledButton,
  rem,
} from '@mantine/core';
import {
  Users,
  Upload,
  FileBarChart2,
  LogOut,
} from 'lucide-react';

export default function SidebarGestor({ children }: { children: React.ReactNode }) {
  const [opened, setOpened] = useState(false);

  return (
    <AppShell
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShellHeader>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={() => setOpened((o) => !o)} hiddenFrom="sm" size="sm" />
          <Text c="white" fw={600} size="lg">Painel do Gestor</Text>
        </Group>
      </AppShellHeader>

      <AppShellNavbar p="md">
        <UnstyledButton
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: rem(10),
            padding: rem(10),
            borderRadius: rem(6),
            marginBottom: rem(12),
            backgroundColor: '#f1f3f5',
          }}
        >
          <Users size={18} />
          <Text size="sm">Cadastro de Usuários</Text>
        </UnstyledButton>

        <UnstyledButton
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: rem(10),
            padding: rem(10),
            borderRadius: rem(6),
            marginBottom: rem(12),
            backgroundColor: '#f1f3f5',
          }}
        >
          <Upload size={18} />
          <Text size="sm">Cadastro de Parceiros</Text>
        </UnstyledButton>

        <UnstyledButton
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: rem(10),
            padding: rem(10),
            borderRadius: rem(6),
            marginBottom: rem(12),
            backgroundColor: '#f1f3f5',
          }}
        >
          <FileBarChart2 size={18} />
          <Text size="sm">Relatórios</Text>
        </UnstyledButton>

        <UnstyledButton
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: rem(10),
            padding: rem(10),
            borderRadius: rem(6),
            marginTop: rem(24),
            backgroundColor: '#fff0f0',
            color: 'red',
          }}
        >
          <LogOut size={18} />
          <Text size="sm" fw={600}>Sair</Text>
        </UnstyledButton>
      </AppShellNavbar>

      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
