import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Grid,
  Card,
  Title,
  Text,
  Loader,
  Tooltip,
  Accordion,
  MultiSelect,
} from '@mantine/core';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, PieChart, Pie, Cell, Legend
} from 'recharts';
import SidebarGestor from '../components/SidebarGestor';

const COLORS = ['#005A64', '#4CDDDD', '#40c057', '#fab005', '#fa5252'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tipoUser, setTipoUser] = useState<string | null>(null);
  const [kpis, setKpis] = useState<any[]>([]);
  const [dadosFunil, setDadosFunil] = useState<any[]>([]);
  const [dadosBarra, setDadosBarra] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState<string[]>([]);
  const [statusFiltro, setStatusFiltro] = useState<string[]>([]);

  const token = localStorage.getItem('token');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [kpiRes, funilRes, barraRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/dashboard/kpis/`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/dashboard/funil/`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/dashboard/oportunidades-mensais/`, { headers }),
      ]);

      setKpis(kpiRes.data);
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
              data={['Estrutura', 'Clareza', 'Informação']}
              label="Filtrar por Categoria"
              placeholder="Selecione categorias"
              value={categoriaFiltro}
              onChange={setCategoriaFiltro}
            />
          </Grid.Col>
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

        {/* KPIs */}
        <Accordion multiple variant="separated" radius="md">
          <Grid>
          {kpis.map((kpi) => (
  <Grid.Col span={3} key={kpi.title}>

                <Accordion.Item value={kpi.title}>
                  <Accordion.Control>
                    <Tooltip label="Clique para ver mais detalhes" withArrow>
                      <Card
                        shadow="lg"
                        padding="lg"
                        radius="lg"
                        withBorder
                        style={{ cursor: 'pointer', transition: '0.3s', backgroundColor: '#f9fafb' }}
                        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)')}
                      >
                        <Title order={4} style={{ color: '#005A64' }}>{kpi.title}</Title>
                        <Text size="xl" fw={700}>
                          {kpi.value}
                        </Text>
                      </Card>
                    </Tooltip>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text size="sm" color="dimmed">Informação detalhada sobre {kpi.title}.</Text>
                  </Accordion.Panel>
                </Accordion.Item>
              </Grid.Col>
            ))}
          </Grid>
        </Accordion>

        {/* Gráficos */}
        <Grid mt="xl">
          {/* Gráfico de Funil */}
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

          {/* Gráfico de Pizza */}
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
                   {(kpis.map((_, index) => (
  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
)))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid.Col>

          {/* Gráfico de Barras */}
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
      </div>
    </SidebarGestor>
  );
}
