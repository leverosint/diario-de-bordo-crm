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
  ScrollArea,
} from '@mantine/core';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, PieChart, Pie, Cell, Legend
} from 'recharts';
import SidebarGestor from '../components/SidebarGestor';

const STATUS_COLORS: { [key: string]: string } = {
  '30 dias': '#40c057',    // Verde
  '60 dias': '#fab005',    // Amarelo
  '90 dias': '#fd7e14',    // Laranja
  '120 dias': '#fa5252',   // Vermelho
};

const OTHER_CARD_COLOR = '#4CDDDD'; // Cor default para Interações e Taxas
const COLORS = ['#005A64', '#4CDDDD', '#40c057', '#fab005', '#fa5252'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tipoUser, setTipoUser] = useState<string | null>(null);
  const [kpis, setKpis] = useState<any[]>([]);
  const [dadosFunil, setDadosFunil] = useState<any[]>([]);
  const [dadosBarra, setDadosBarra] = useState<any[]>([]);
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [statusFiltro, setStatusFiltro] = useState<string[]>([]);

  const token = localStorage.getItem('token');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [kpiRes, funilRes, barraRes, parceirosRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/dashboard/kpis/`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/dashboard/funil/`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/dashboard/oportunidades-mensais/`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/parceiros-list/`, { headers }),
      ]);

      setKpis(kpiRes.data);
      setDadosFunil(funilRes.data);
      setDadosBarra(barraRes.data);
      setParceiros(parceirosRes.data);
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

  // Separar KPIs por grupos
  const statusKpis = kpis.filter(kpi =>
    ['30 dias', '60 dias', '90 dias', '120 dias'].includes(kpi.title)
  );
  const interacoesKpis = kpis.filter(kpi =>
    ['Interações', 'Oportunidades', 'Valor Gerado', 'Ticket Médio'].includes(kpi.title)
  );
  const taxasKpis = kpis.filter(kpi =>
    kpi.title.includes('Taxa')
  );

  // Aplicar filtro
  const parceirosFiltrados = statusFiltro.length > 0
    ? parceiros.filter((p: any) => statusFiltro.includes(p.status))
    : parceiros;

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
              searchable
              clearable
            />
          </Grid.Col>
        </Grid>

        {/* Área de Status */}
        <Title order={4} mt="md" mb="sm" fw={700}>Status dos Parceiros</Title>
        <Grid>
          {statusKpis.map((kpi) => (
            <Grid.Col span={3} key={kpi.title}>
              <Card shadow="lg" padding="lg" radius="lg" withBorder style={{ backgroundColor: STATUS_COLORS[kpi.title] }}>
                <Title order={5} style={{ color: '#fff' }}>{kpi.title}</Title>
                <Text size="xl" fw={700} color="#fff">
                  {kpi.value}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* Área de Interações e Oportunidades */}
        <Title order={4} mt="xl" mb="sm" fw={700}>Interações e Oportunidades</Title>
        <Grid>
          {interacoesKpis.map((kpi) => (
            <Grid.Col span={3} key={kpi.title}>
              <Card shadow="lg" padding="lg" radius="lg" withBorder style={{ backgroundColor: OTHER_CARD_COLOR }}>
                <Title order={5} style={{ color: '#fff' }}>{kpi.title}</Title>
                <Text size="xl" fw={700} color="#fff">
                  {kpi.value}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* Área de Taxas */}
        <Title order={4} mt="xl" mb="sm" fw={700}>Taxas de Conversão</Title>
        <Grid>
          {taxasKpis.map((kpi) => (
            <Grid.Col span={4} key={kpi.title}>
              <Card shadow="lg" padding="lg" radius="lg" withBorder style={{ backgroundColor: OTHER_CARD_COLOR }}>
                <Title order={5} style={{ color: '#fff' }}>{kpi.title}</Title>
                <Text size="xl" fw={700} color="#fff">
                  {kpi.value}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* Gráficos */}
        <Grid mt="xl">
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

          <Grid.Col span={4}>
            <Card shadow="sm" padding="lg" radius="lg" withBorder>
              <Title order={5} mb="md" style={{ color: '#005A64' }}>Distribuição de Status</Title>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusKpis}
                    dataKey="value"
                    nameKey="title"
                    outerRadius={100}
                    label
                  >
                    {statusKpis.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid.Col>

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

        {/* Tabela Dinâmica */}
        <Title order={4} mt="xl" mb="sm" fw={700}>Parceiros</Title>
        <ScrollArea>
          <Table highlightOnHover striped withColumnBorders>
            <thead style={{ backgroundColor: '#f1f3f5' }}>
              <tr>
                <th>Parceiro</th>
                <th>Status</th>
                <th>Total Faturado</th>
                <th>Consultor</th>
                <th>Unidade</th>
                <th>Última Interação</th>
                <th>Última Venda</th>
              </tr>
            </thead>
            <tbody>
              {parceirosFiltrados.map((p: any) => (
                <tr key={p.id}>
                  <td>{p.parceiro}</td>
                  <td>{p.status}</td>
                  <td>R$ {p.total_geral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>{p.consultor}</td>
                  <td>{p.unidade}</td>
                  <td>{p.ultimo_fat ? new Date(p.ultimo_fat).toLocaleDateString() : '-'}</td>
                  <td>{p.primeiro_fat ? new Date(p.primeiro_fat).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ScrollArea>
      </div>
    </SidebarGestor>
  );
}
