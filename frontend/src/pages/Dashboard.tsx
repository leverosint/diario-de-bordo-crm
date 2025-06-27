import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Container, Loader, Group, Card, Text, Paper, Select, Title, Table, Pagination, Flex
} from '@mantine/core';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import SidebarGestor from '../components/SidebarGestor';
import dayjs from 'dayjs';

// Status possíveis conforme seu CSV
const STATUS_LABELS: Record<string, string> = {
  '60 dias s/ Fat': '60 dias s/ Fat',
  '30 dias s/ Fat': '30 dias s/ Fat',
  'Base Ativa': 'Base Ativa',
  '90 dias s/ Fat': '90 dias s/ Fat',
  '120 dias s/ Fat': '120 dias s/ Fat',
  'Sem Faturamento': 'Sem Faturamento',
};

const COLORS = ['#005A64', '#43AA8B', '#FAA613', '#F44708', '#BEBEBE', '#7B7B7B'];

interface ResumoParceiro {
  parceiro_id: number;
  codigo: string;
  parceiro: string;
  consultor: string;
  unidade: string;
  status_parceiro: string;
  data_ref: string;
  total_interacoes: number;
  interacoes_whatsapp: number;
  interacoes_ligacao: number;
  interacoes_email: number;
  total_oportunidades: number;
  oportunidades_pedido: number;
  oportunidades_perdida: number;
  oportunidades_oportunidade: number;
  oportunidades_orcamento: number;
  oportunidades_aguardando: number;
}

interface User {
  tipo_user: 'VENDEDOR' | 'GESTOR' | 'ADMIN';
  nome: string;
  canais: string[];
  consultor: string;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<ResumoParceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoUser, setTipoUser] = useState<User['tipo_user']>('VENDEDOR');

  // Filtros
  const [mes, setMes] = useState<string>(String(dayjs().month() + 1).padStart(2, '0'));
  const [ano, setAno] = useState<string>(String(dayjs().year()));
  const [unidade, setUnidade] = useState<string | null>(null);
  const [consultor, setConsultor] = useState<string | null>(null);

  // Paginação tabela
  const [activePage, setActivePage] = useState(1);
  const pageSize = 20;

  // Carrega usuário do localStorage
  useEffect(() => {
    const usuarioRaw = localStorage.getItem('user');
    let usuarioSalvo: Partial<User> = {};
    if (usuarioRaw) {
      try {
        usuarioSalvo = JSON.parse(usuarioRaw);
      } catch { usuarioSalvo = {}; }
    }
    setTipoUser(usuarioSalvo.tipo_user ?? 'VENDEDOR');
    setConsultor(typeof usuarioSalvo.consultor === 'string' && usuarioSalvo.consultor.length > 0
      ? usuarioSalvo.consultor
      : null
    );
  }, []);

  // Carrega dados
  useEffect(() => {
    setLoading(true);
    axios.get('/dashboard/resumo-parceiros/', {
      params: {
        mes,
        ano,
        unidade: unidade || '',
        consultor: consultor || ''
      }
    }).then(res => {
      setData(res.data);
      setLoading(false);
      setActivePage(1);
    });
  }, [mes, ano, unidade, consultor]);

  // Prepara opções de filtro (únicos no resultado)
  const unidades = useMemo(
    () => Array.from(new Set(data.map(d => d.unidade))).filter(Boolean),
    [data]
  );
  const consultores = useMemo(
    () => Array.from(new Set(data.map(d => d.consultor))).filter(Boolean),
    [data]
  );

  // Filtro aplicado
  const filtered = useMemo(() => {
    return data
      .filter(d => !unidade || d.unidade === unidade)
      .filter(d => !consultor || d.consultor === consultor)
      .filter(d => !mes || (d.data_ref && d.data_ref.slice(5, 7) === mes))
      .filter(d => !ano || (d.data_ref && d.data_ref.slice(0, 4) === ano));
  }, [data, unidade, consultor, mes, ano]);

  // KPIs
  const totalParceiros = filtered.length;
  const totalInteracoes = filtered.reduce((a, b) => a + (b.total_interacoes || 0), 0);
  const totalContatados = filtered.filter(d => d.total_interacoes > 0).length;
  const totalNuncaContatados = filtered.filter(d => (d.total_interacoes || 0) === 0).length;
  const totalOportunidades = filtered.reduce((a, b) => a + (b.total_oportunidades || 0), 0);

  // Gráfico: Parceiros por status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(d => {
      if (!counts[d.status_parceiro]) counts[d.status_parceiro] = 0;
      counts[d.status_parceiro]++;
    });
    return counts;
  }, [filtered]);

  // Taxas de conversão
  const orcamentoToPedido =
    ((filtered.reduce((a, b) => a + (b.oportunidades_pedido || 0), 0)) /
      ((filtered.reduce((a, b) => a + (b.oportunidades_orcamento || 0), 0)) || 1)) * 100;

  const oportunidadeToPedido =
    ((filtered.reduce((a, b) => a + (b.oportunidades_pedido || 0), 0)) /
      ((filtered.reduce((a, b) => a + (b.oportunidades_oportunidade || 0), 0)) || 1)) * 100;

  // Paginação tabela
  const paginated = useMemo(
    () => filtered.slice((activePage - 1) * pageSize, activePage * pageSize),
    [filtered, activePage]
  );

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Container size="xl" py="lg">
        <Title order={2} c="#005A64" mb="md">
          Dashboard Diário de Bordo
        </Title>

        {/* === Filtros === */}
        <Group gap="md" mb="lg" wrap="wrap">
          <Select
            label="Mês"
            value={mes}
            onChange={(value) => setMes(value || '')}
            data={Array.from({ length: 12 }, (_, i) => ({
              value: String(i + 1).padStart(2, '0'),
              label: dayjs().month(i).format('MMMM').replace(/^./, str => str.toUpperCase())
            }))}
            style={{ minWidth: 120 }}
          />
          <Select
            label="Ano"
            value={ano}
            onChange={(value) => setAno(value || '')}
            data={Array.from({ length: 3 }, (_, i) => {
              const year = dayjs().year() - i;
              return { value: String(year), label: String(year) };
            })}
            style={{ minWidth: 100 }}
          />
          <Select
            label="Unidade"
            value={unidade}
            onChange={(value) => setUnidade(value ?? null)}
            data={unidades.map(u => ({ value: u, label: u }))}
            clearable
            style={{ minWidth: 160 }}
          />
          {tipoUser !== 'VENDEDOR' && (
            <Select
              label="Consultor"
              value={consultor}
              onChange={(value) => setConsultor(value)}
              data={consultores.map(c => ({ value: c, label: c }))}
              clearable
              style={{ minWidth: 160 }}
            />
          )}
        </Group>

        {loading ? <Loader size="xl" /> : (
          <>
            {/* === KPIs === */}
            <Group gap="md" mb="md">
              <Card shadow="md" padding="lg" radius="md" withBorder style={{ minWidth: 160 }}>
                <Text fw={700} size="xl">{totalParceiros}</Text>
                <Text size="sm" c="dimmed">Total de Parceiros</Text>
              </Card>
              <Card shadow="md" padding="lg" radius="md" withBorder style={{ minWidth: 160 }}>
                <Text fw={700} size="xl">{totalContatados}</Text>
                <Text size="sm" c="dimmed">Parceiros Contatados</Text>
              </Card>
              <Card shadow="md" padding="lg" radius="md" withBorder style={{ minWidth: 160 }}>
                <Text fw={700} size="xl">{totalNuncaContatados}</Text>
                <Text size="sm" c="dimmed">Nunca Contatados</Text>
              </Card>
              <Card shadow="md" padding="lg" radius="md" withBorder style={{ minWidth: 160 }}>
                <Text fw={700} size="xl">{totalInteracoes}</Text>
                <Text size="sm" c="dimmed">Total de Interações</Text>
              </Card>
              <Card shadow="md" padding="lg" radius="md" withBorder style={{ minWidth: 160 }}>
                <Text fw={700} size="xl">{totalOportunidades}</Text>
                <Text size="sm" c="dimmed">Total de Oportunidades</Text>
              </Card>
            </Group>

            {/* === GRÁFICOS === */}
            <Flex gap="md" mb="md" align="flex-start" wrap="wrap">
              {/* 1. Parceiros por status */}
              <Paper shadow="xs" p="md" radius="md" style={{ flex: 1, minWidth: 280 }}>
                <Title order={4} c="#005A64" mb={10}>Parceiros por Status</Title>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={Object.entries(statusCounts).map(([status, value]) => ({
                        name: STATUS_LABELS[status] || status,
                        value
                      }))}
                      dataKey="value"
                      cx="50%" cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={70}
                    >
                      {Object.entries(statusCounts).map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>

              {/* 2. Interações por Status */}
              <Paper shadow="xs" p="md" radius="md" style={{ flex: 1, minWidth: 280 }}>
                <Title order={4} c="#005A64" mb={10}>Interações por Status</Title>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={Object.entries(
                      filtered.reduce((acc, d) => {
                        acc[d.status_parceiro] = (acc[d.status_parceiro] || 0) + Number(d.total_interacoes || 0);
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([status, total]) => ({
                      name: STATUS_LABELS[status] || status,
                      value: total
                    }))}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Bar dataKey="value" fill="#005A64" radius={[8, 8, 0, 0]} />
                    <RechartsTooltip />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>

              {/* 3. Parceiros Contatados por Status */}
              <Paper shadow="xs" p="md" radius="md" style={{ flex: 1, minWidth: 280 }}>
                <Title order={4} c="#005A64" mb={10}>Parceiros Contatados por Status</Title>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={Object.entries(
                      filtered.filter(d => Number(d.total_interacoes) > 0).reduce((acc, d) => {
                        acc[d.status_parceiro] = (acc[d.status_parceiro] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([status, count]) => ({
                      name: STATUS_LABELS[status] || status,
                      value: count
                    }))}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Bar dataKey="value" fill="#43AA8B" radius={[8, 8, 0, 0]} />
                    <RechartsTooltip />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Flex>

            {/* 4. Taxas de Conversão por Etapa */}
            <Paper shadow="xs" p="md" radius="md" mb="md">
              <Title order={4} c="#005A64" mb={10}>Taxas de Conversão por Etapa</Title>
              <Text>Orçamento → Pedido: {orcamentoToPedido.toFixed(1)}%</Text>
              <Text>Oportunidade → Pedido: {oportunidadeToPedido.toFixed(1)}%</Text>
            </Paper>

            {/* 5. Resumo das Etapas Comerciais */}
            <Paper shadow="xs" p="md" radius="md" mb="md">
              <Title order={4} c="#005A64" mb={10}>Resumo das Etapas Comerciais</Title>
              <Group gap="md">
                <Card><Text>Pedidos</Text><Text fw={700}>{filtered.reduce((a, b) => a + (b.oportunidades_pedido || 0), 0)}</Text></Card>
                <Card><Text>Orçamentos</Text><Text fw={700}>{filtered.reduce((a, b) => a + (b.oportunidades_orcamento || 0), 0)}</Text></Card>
                <Card><Text>Oportunidades</Text><Text fw={700}>{filtered.reduce((a, b) => a + (b.oportunidades_oportunidade || 0), 0)}</Text></Card>
                <Card><Text>Perdidas</Text><Text fw={700}>{filtered.reduce((a, b) => a + (b.oportunidades_perdida || 0), 0)}</Text></Card>
              </Group>
            </Paper>

            {/* === Tabela final === */}
            <Paper shadow="xs" p="md" radius="md">
              <Title order={4} c="#005A64" mb={10}>Tabela de Resumo Mensal</Title>
              <Table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Parceiro</th>
                    <th>Consultor</th>
                    <th>Unidade</th>
                    <th>Status</th>
                    <th>Total Interações</th>
                    <th>Total Oportunidades</th>
                    <th>Orçamentos</th>
                    <th>Pedidos</th>
                    <th>Perdidas</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row, i) => (
                    <tr key={i}>
                      <td>{row.codigo}</td>
                      <td>{row.parceiro}</td>
                      <td>{row.consultor}</td>
                      <td>{row.unidade}</td>
                      <td>{STATUS_LABELS[row.status_parceiro] || row.status_parceiro}</td>
                      <td>{row.total_interacoes}</td>
                      <td>{row.total_oportunidades}</td>
                      <td>{row.oportunidades_orcamento}</td>
                      <td>{row.oportunidades_pedido}</td>
                      <td>{row.oportunidades_perdida}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Group mt="md" justify="right">
                <Pagination
                  total={Math.ceil(filtered.length / pageSize)}
                  value={activePage}
                  onChange={setActivePage}
                  size="md"
                  color="teal"
                />
              </Group>
            </Paper>
          </>
        )}
      </Container>
    </SidebarGestor>
  );
};

export default Dashboard;
