import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
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
  Pagination,
  Container,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import SidebarGestor from '../components/SidebarGestor';

const STATUS_COLORS: { [key: string]: string } = {
  '30 dias': '#40c057',
  '60 dias': '#fab005',
  '90 dias': '#fd7e14',
  '120 dias': '#fa5252',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [tipoUser, setTipoUser] = useState<string | null>(null);
  const [kpis, setKpis] = useState<any[]>([]);
  const [tabelaParceiros, setTabelaParceiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFiltro, setStatusFiltro] = useState<string[]>([]);
  const [dateFiltro, setDateFiltro] = useState<[string | null, string | null]>([null, null]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  const token = localStorage.getItem('token');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const kpiRes = await axios.get(`${import.meta.env.VITE_API_URL}/dashboard/kpis/`, { headers });

      setKpis(kpiRes.data.kpis);
      setTabelaParceiros(kpiRes.data.parceiros || []);
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

  // Filtragem dinâmica
  const parceirosFiltrados = tabelaParceiros.filter((p: any) => {
    const statusMatch = statusFiltro.length > 0 ? statusFiltro.includes(p.status) : true;
    const dateMatch =
      dateFiltro[0] && dateFiltro[1]
        ? p.ultima_interacao &&
          dayjs(p.ultima_interacao, 'DD/MM/YYYY').isAfter(dayjs(dateFiltro[0])) &&
          dayjs(p.ultima_interacao, 'DD/MM/YYYY').isBefore(dayjs(dateFiltro[1]))
        : true;
    return statusMatch && dateMatch;
  });

  const exportToExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const paginatedData = parceirosFiltrados.slice((page - 1) * perPage, page * perPage);

  const resetFiltros = () => {
    setStatusFiltro([]);
    setDateFiltro([null, null]);
    setPage(1);
  };

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Container fluid style={{ padding: '20px', maxWidth: '100%' }}>
        <Title order={2} mb="md" style={{ color: '#005A64' }}>
          {tipoUser === 'GESTOR' && 'Dashboard do Gestor'}
          {tipoUser === 'VENDEDOR' && 'Dashboard do Vendedor'}
          {tipoUser === 'ADMIN' && 'Dashboard do Administrador'}
        </Title>

        {/* Filtros */}
        <Group grow mb="xl" style={{ flexWrap: 'wrap' }}>
          <MultiSelect
            data={['30 dias', '60 dias', '90 dias', '120 dias']}
            label="Filtrar por Status"
            placeholder="Selecione status"
            value={statusFiltro}
            onChange={setStatusFiltro}
            clearable
          />
          <DatePickerInput
            type="range"
            label="Filtrar por Data de Interação"
            placeholder="Selecione intervalo de datas"
            value={dateFiltro}
            onChange={setDateFiltro}
            clearable
          />
          <Button variant="light" color="red" onClick={resetFiltros}>
            Resetar Filtros
          </Button>
        </Group>

        {/* KPIs - Quantidade Parceiros */}
        <Title order={3} mb="sm">Quantidade de Parceiros Sem Interações</Title>
        <Grid mb="xl">
          {['30 dias', '60 dias', '90 dias', '120 dias'].map(status => (
            <Grid.Col span={3} key={status}>
              <Card
                shadow="md"
                padding="lg"
                radius="lg"
                withBorder
                style={{
                  backgroundColor: STATUS_COLORS[status],
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
                onClick={() => setStatusFiltro([status])}
              >
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
              <Card
                shadow="md"
                padding="lg"
                radius="lg"
                withBorder
                style={{ textAlign: 'center' }}
              >
                <Title order={4}>{title}</Title>
                <Text size="xl" fw={700}>
                  {kpis.find(k => k.title === title)?.value || 0}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        <Divider my="lg" />

        {/* Tabela */}
        <Title order={3} mb="md">Todos os Parceiros ({parceirosFiltrados.length})</Title>
        <Card shadow="md" padding="md" radius="md" withBorder mb="lg">
          <Group mb="md" justify="space-between">
            <Button
              variant="outline"
              color="teal"
              size="xs"
              onClick={() => exportToExcel(parceirosFiltrados, 'parceiros')}
            >
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
                {paginatedData.map((p: any, idx: number) => (
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
          <Pagination
            value={page}
            onChange={setPage}
            total={Math.ceil(parceirosFiltrados.length / perPage)}
            mt="md"
            size="sm"
          />
        </Card>
      </Container>
    </SidebarGestor>
  );
}
