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
  Divider,
  Table,
  ScrollArea,
  Button,
  Group,
  Container,
} from '@mantine/core';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, PieChart, Pie, Cell, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
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

  const parceirosFiltrados = statusFiltro.length > 0
    ? tabelaParceiros.filter((p: any) => statusFiltro.includes(p.status))
    : tabelaParceiros;

  const parceirosInteracoes = parceirosFiltrados.filter(p => p.tem_interacao);
  const parceirosOportunidades = parceirosFiltrados.filter(p => p.tem_oportunidade);

  // Função para exportar
  const exportToExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Container fluid style={{ padding: 20 }}>
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

        {/* KPIs - Quantidade Parceiros */}
        <Title order={3} mb="sm">Quantidade de Parceiros Sem Interações</Title>
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

        <Divider my="lg" />

        {/* KPIs - Indicadores */}
        <Title order={3} mb="sm">Indicadores de Atividades e Resultados</Title>
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

        <Divider my="lg" />

        {/* KPIs - Taxas */}
        <Title order={3} mb="sm">Taxas de Conversão por Etapa</Title>
        <Grid mb="xl">
          {['Taxa Interação > Oportunidade', 'Taxa Oportunidade > Orçamento', 'Taxa Orçamento > Pedido'].map(title => (
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

        <Divider my="lg" />

        {/* Gráficos */}
        <Grid>
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
        <Divider my="xl" />
        {[
          { title: "Todos os Parceiros", data: parceirosFiltrados, exportName: "parceiros" },
          { title: "Parceiros com Interação", data: parceirosInteracoes, exportName: "parceiros_interacoes" },
          { title: "Parceiros com Oportunidade", data: parceirosOportunidades, exportName: "parceiros_oportunidades" },
        ].map((section, index) => (
          <div key={index}>
            <Title order={3} mb="md">{section.title}</Title>
            <Card shadow="md" padding="md" radius="md" withBorder mb="lg">
            <Group justify="space-between" mb="sm">
                <Button variant="outline" color="teal" size="xs" onClick={() => exportToExcel(section.data, section.exportName)}>
                  Exportar Excel
                </Button>
              </Group>
              <ScrollArea>
                <Table striped highlightOnHover withColumnBorders>
                  <thead style={{ backgroundColor: '#f1f3f5' }}>
                    <tr>
                      <th>Parceiro</th>
                      <th>Status</th>
                      <th>Faturamento Total</th>
                      <th>Última Interação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.data.map((p: any, idx: number) => (
                      <tr key={idx}>
                        <td>{p.parceiro}</td>
                        <td>{p.status}</td>
                        <td>R$ {Number(p.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td>{p.ultima_interacao || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </ScrollArea>
            </Card>
          </div>
        ))}
      </Container>
    </SidebarGestor>
  );
}
