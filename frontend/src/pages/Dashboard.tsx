import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Grid,
  Card,
  Title,
  Text,
  Loader,
  MultiSelect,
  Table,
} from '@mantine/core';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, PieChart, Pie, Cell, Legend,
} from 'recharts';
import SidebarGestor from '../components/SidebarGestor';

const STATUS_COLORS: { [key: string]: string } = {
  '30 dias': '#40c057',
  '60 dias': '#fab005',
  '90 dias': '#fd7e14',
  '120 dias': '#fa5252',
};

const COLORS = ['#005A64', '#4CDDDD', '#40c057', '#fab005', '#fa5252'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tipoUser, setTipoUser] = useState<string | null>(null);
  const [kpis, setKpis] = useState<any[]>([]);
  const [dadosFunil, setDadosFunil] = useState<any[]>([]);
  const [dadosBarra, setDadosBarra] = useState<any[]>([]);
  const [tabelaParceiros, setTabelaParceiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState<string[]>([]);
  const token = localStorage.getItem('token');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [kpiRes, funilRes, barraRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/dashboard/kpis/`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/dashboard/funil/`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/dashboard/oportunidades-mensais/`, { headers }),
      ]);

      setKpis(kpiRes.data.kpis);
      setTabelaParceiros(kpiRes.data.parceiros || []);
      setDadosFunil(funilRes.data);
      setDadosBarra(barraRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '');
      if (!usuario?.tipo_user) {
        navigate('/');
        return;
      }
      setTipoUser(usuario.tipo_user);
      fetchDashboardData();
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      navigate('/');
    }
  }, [token, navigate]);

  if (!token || !tipoUser) return null;

  if (loading) {
    return (
      <SidebarGestor tipoUser={tipoUser}>
        <div style={{ padding: 20 }}>
          <Loader />
        </div>
      </SidebarGestor>
    );
  }

  // Aplicar filtros
  const parceirosFiltrados = statusFiltro.length > 0
    ? tabelaParceiros.filter((p: any) => statusFiltro.includes(p.status))
    : tabelaParceiros;

  const parceirosInteracao = parceirosFiltrados.filter((p: any) => p.tem_interacao);
  const parceirosOportunidade = parceirosFiltrados.filter((p: any) => p.tem_oportunidade);

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <div style={{ padding: 20 }}>
        <Title order={2} mb="md" style={{ color: '#005A64' }}>
          {tipoUser === 'GESTOR' && 'Dashboard do Gestor'}
          {tipoUser === 'VENDEDOR' && 'Dashboard do Vendedor'}
          {tipoUser === 'ADMIN' && 'Dashboard do Administrador'}
        </Title>

        {/* Filtros */}
        <Grid mb="xl">
          <Grid.Col span={6}>
            <MultiSelect
              data={['30 dias', '60 dias', '90 dias', '120 dias']}
              label="Filtrar por Status"
              placeholder="Selecione status"
              value={statusFiltro}
              onChange={setStatusFiltro}
            />
          </Grid.Col>
        </Grid>

        {/* Seção 1: Quantidade de Parceiros sem Interações */}
        <Title order={3} mb="md">Quantidade de Parceiros Sem Interações</Title>
        <Grid mb="xl">
          {['30 dias', '60 dias', '90 dias', '120 dias'].map(status => (
            <Grid.Col span={3} key={status}>
              <Card shadow="md" padding="lg" radius="lg" withBorder style={{ backgroundColor: STATUS_COLORS[status], color: 'white' }}>
                <Title order={4}>{status}</Title>
                <Text size="xl" fw={700}>
                  {kpis.find(k => k.title === status)?.value || 0}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* Seção 2: Interações, Oportunidades e Faturamento */}
        <Title order={3} mb="md">Interações, Oportunidades e Faturamento</Title>
        <Grid mb="xl">
          {['Interações', 'Oportunidades', 'Valor Gerado', 'Ticket Médio'].map(title => (
            <Grid.Col span={3} key={title}>
              <Card shadow="md" padding="lg" radius="lg" withBorder>
                <Title order={4}>{title}</Title>
                <Text size="xl" fw={700}>
                  {kpis.find(k => k.title === title)?.value || 0}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* Seção 3: Taxas por Etapa */}
        <Title order={3} mb="md">Taxas de Conversão por Etapa (%)</Title>
        <Grid mb="xl">
          {['Taxa Interação → Oportunidade', 'Taxa Oportunidade → Orçamento', 'Taxa Orçamento → Venda'].map(title => (
            <Grid.Col span={4} key={title}>
              <Card shadow="md" padding="lg" radius="lg" withBorder>
                <Title order={4}>{title}</Title>
                <Text size="xl" fw={700}>
                  {kpis.find(k => k.title === title)?.value || '0%'}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* Gráficos */}
        <Grid mt="xl">
          {/* Funil de Conversão */}
          <Grid.Col span={4}>
            <Card shadow="sm" padding="lg" radius="lg" withBorder>
              <Title order={5} mb="md" style={{ color: '#005A64' }}>Funil de Conversão</Title>
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Funnel dataKey="value" data={dadosFunil} isAnimationActive>
                    <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </Card>
          </Grid.Col>

          {/* Distribuição de Status */}
          <Grid.Col span={4}>
            <Card shadow="sm" padding="lg" radius="lg" withBorder>
              <Title order={5} mb="md" style={{ color: '#005A64' }}>Distribuição de Status</Title>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={kpis.filter(kpi => ['30 dias', '60 dias', '90 dias', '120 dias'].includes(kpi.title))}
                    dataKey="value"
                    nameKey="title"
                    outerRadius={100}
                    label
                  >
                    {kpis.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid.Col>

          {/* Evolução Mensal */}
          <Grid.Col span={4}>
            <Card shadow="sm" padding="lg" radius="lg" withBorder>
              <Title order={5} mb="md" style={{ color: '#005A64' }}>Evolução Mensal</Title>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosBarra}>
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="oportunidades" fill="#4CDDDD" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Tabelas */}
        <Title order={3} mt="xl" mb="md">Tabela de Parceiros</Title>
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <thead>
            <tr>
              <th>Parceiro</th>
              <th>Status</th>
              <th>Faturamento Total</th>
              <th>Última Interação</th>
            </tr>
          </thead>
          <tbody>
            {parceirosFiltrados.map((p: any, idx: number) => (
              <tr key={idx}>
                <td>{p.parceiro}</td>
                <td>{p.status}</td>
                <td>R$ {Number(p.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>{p.ultima_interacao || '-'}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Tabela de Parceiros com Interação */}
        <Title order={3} mt="xl" mb="md">Parceiros com Interações</Title>
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <thead>
            <tr>
              <th>Parceiro</th>
              <th>Status</th>
              <th>Faturamento Total</th>
              <th>Última Interação</th>
            </tr>
          </thead>
          <tbody>
            {parceirosInteracao.map((p: any, idx: number) => (
              <tr key={idx}>
                <td>{p.parceiro}</td>
                <td>{p.status}</td>
                <td>R$ {Number(p.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>{p.ultima_interacao || '-'}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Tabela de Parceiros com Oportunidade */}
        <Title order={3} mt="xl" mb="md">Parceiros com Oportunidades</Title>
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <thead>
            <tr>
              <th>Parceiro</th>
              <th>Status</th>
              <th>Faturamento Total</th>
              <th>Última Interação</th>
            </tr>
          </thead>
          <tbody>
            {parceirosOportunidade.map((p: any, idx: number) => (
              <tr key={idx}>
                <td>{p.parceiro}</td>
                <td>{p.status}</td>
                <td>R$ {Number(p.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>{p.ultima_interacao || '-'}</td>
              </tr>
            ))}
          </tbody>
        </Table>

      </div>
    </SidebarGestor>
  );
}
