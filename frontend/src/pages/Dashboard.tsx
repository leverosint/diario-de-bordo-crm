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
  Pagination,
} from '@mantine/core';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, PieChart, Pie, Cell, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import SidebarGestor from '../components/SidebarGestor';
import { Select } from '@mantine/core'; // ✅ Mantém aqui no topo

const STATUS_COLORS: { [key: string]: string } = {
  'Sem Faturamento': '#228be6',
  'Base Ativa': '#15aabf',
  '30 dias s/ Fat': '#40c057',
  '60 dias s/ Fat': '#fab005',
  '90 dias s/ Fat': '#fd7e14',
  '120 dias s/ Fat': '#fa5252',
};

const STATUS_ORDER = [
  'Sem Faturamento',
  'Base Ativa',
  '30 dias s/ Fat',
  '60 dias s/ Fat',
  '90 dias s/ Fat',
  '120 dias s/ Fat',
];

const STATUS_LABELS: { [key: string]: string } = {
  'Sem Faturamento': 'Sem Fat.',
  'Base Ativa': 'Base Ativa',
  '30 dias s/ Fat': '30 dias',
  '60 dias s/ Fat': '60 dias',
  '90 dias s/ Fat': '90 dias',
  '120 dias s/ Fat': '120 dias',
};

const STATUS_OPTIONS = STATUS_ORDER.map((status) => ({
  value: status,
  label: STATUS_LABELS[status] || status
}));


const COLORS = Object.values(STATUS_COLORS); // ✅ Adicione ESSA LINHA aqui


const MESES = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' }, { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' }, { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

const ANOS = ['2024', '2025', '2026'].map(ano => ({ value: ano, label: ano }));


export default function Dashboard() {
  const navigate = useNavigate();
  const [tipoUser, setTipoUser] = useState<string | null>(null);
  const [kpis, setKpis] = useState<any[]>([]);
  const [dadosFunil, setDadosFunil] = useState<any[]>([]);
  const [dadosBarra, setDadosBarra] = useState<any[]>([]);
  const [tabelaParceiros, setTabelaParceiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [parceirosContatadosStatus, setParceirosContatadosStatus] = useState<Record<string, number>>({}); // ✅ ADICIONE AQUI

  

  

  const [mesSelecionado, setMesSelecionado] = useState<string | null>('6');
  const [anoSelecionado, setAnoSelecionado] = useState<string | null>('2025');
  const [statusFiltro, setStatusFiltro] = useState<string[]>([]);
  const [pageMap, setPageMap] = useState<{ [key: string]: number }>({});
  const recordsPerPage = 5;

  const token = localStorage.getItem('token');

  
  const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };
        const mes = mesSelecionado || String(new Date().getMonth() + 1);
        const ano = anoSelecionado || String(new Date().getFullYear());
    
        const [kpiRes, funilRes, barraRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/dashboard/kpis/?mes=${mes}&ano=${ano}`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/dashboard/funil/`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/dashboard/oportunidades-mensais/`, { headers }),
        ]);
    
        setKpis(kpiRes.data.kpis);
        setParceirosContatadosStatus(kpiRes.data.parceiros_contatados_status || {});
        setTabelaParceiros(kpiRes.data.parceiros || []);
        setDadosFunil(funilRes.data);
        setDadosBarra(barraRes.data);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    

  const fetchHistoricoInteracoes = async (parceiroId: number) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/interacoes/historico/?parceiro_id=${parceiroId}`, { headers });
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar histórico para parceiro ${parceiroId}:`, error);
      return [];
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
    
    // Recalcular interações por status com base nos parceiros filtrados
const interacoesStatusFiltrado: Record<string, number> = {};
const parceirosContatadosStatusFiltrado: Record<string, number> = {};

for (const parceiro of parceirosFiltrados) {
  if (parceiro.tem_interacao) {
    interacoesStatusFiltrado[parceiro.status] = (interacoesStatusFiltrado[parceiro.status] || 0) + (parceiro.qtd_interacoes || 1);
    parceirosContatadosStatusFiltrado[parceiro.status] = (parceirosContatadosStatusFiltrado[parceiro.status] || 0) + 1;
  }
}


  const parceirosInteracoes = parceirosFiltrados.filter(p => p.tem_interacao);
  const parceirosOportunidades = parceirosFiltrados.filter(p => p.tem_oportunidade);
  const parceirosPendentes = parceirosFiltrados.filter(p => !p.tem_interacao);
  // 📊 Cálculo de KPIs de Contato
  const totalCarteira = parceirosFiltrados.length;
  const totalContatados = Object.values(parceirosContatadosStatus).reduce((sum, val) => sum + val, 0);
  const percentualContatado = totalCarteira > 0 ? (totalContatados / totalCarteira) * 100 : 0;
  const percentualPorStatus: Record<string, number> = {};
STATUS_ORDER.forEach(status => {
  const count = parceirosFiltrados.filter(p => p.status === status).length;
  percentualPorStatus[status] = totalCarteira > 0 ? (count / totalCarteira) * 100 : 0;
});



  const getPaginatedData = (key: string, data: any[]) => {
    const page = pageMap[key] || 1;
    const startIndex = (page - 1) * recordsPerPage;
    return data.slice(startIndex, startIndex + recordsPerPage);
  };

  const handlePageChange = (key: string, page: number) => {
    setPageMap(prev => ({ ...prev, [key]: page }));
  };

  const exportToExcel = async (data: any[], fileName: string, exportarHistorico = false) => {
    const wb = XLSX.utils.book_new();

    const sheetData = data.map((p) => ({
      Parceiro: p.parceiro,
      Status: p.status,
      'Faturamento Total': p.total,
      'Última Interação': p.ultima_interacao || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Resumo Parceiros');

    if (exportarHistorico) {
      let historicoData: any[] = [];

      for (const parceiro of data) {
        const interacoes = await fetchHistoricoInteracoes(parceiro.id);
        const interacoesFormatadas = interacoes.map((i: any) => ({
          Parceiro: parceiro.parceiro,
          Tipo: i.tipo,
          'Data da Interação': i.data_interacao,
          'Entrou em Contato': i.entrou_em_contato ? 'Sim' : 'Não',
        }));
        historicoData = historicoData.concat(interacoesFormatadas);
      }

      const wsHistorico = XLSX.utils.json_to_sheet(historicoData);
      XLSX.utils.book_append_sheet(wb, wsHistorico, 'Histórico Interações');
    }

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

 // Dados com filtro ativo
const statusDataFiltrado = STATUS_ORDER.map(status => {
  const parceirosDoStatus = parceirosFiltrados.filter(p => p.status === status);
  const parceirosComInteracao = parceirosDoStatus.filter(p => p.tem_interacao);
  const parceirosContatadosUnicos = new Set(parceirosComInteracao.map(p => p.id));
  return {
    status: STATUS_LABELS[status] || status,
    parceiros: parceirosDoStatus.length,
    interacoes: parceirosComInteracao.reduce((sum, p) => sum + (p.qtd_interacoes || 1), 0),
    contatados: parceirosContatadosUnicos.size,
  };
});

// Dados completos (sem filtro)
const statusDataCompleto = STATUS_ORDER.map(status => {
  const parceirosDoStatus = tabelaParceiros.filter(p => p.status === status);
  const parceirosComInteracao = parceirosDoStatus.filter(p => p.tem_interacao);
  const parceirosContatadosUnicos = new Set(parceirosComInteracao.map(p => p.id));
  return {
    status: STATUS_LABELS[status] || status,
    parceiros: parceirosDoStatus.length,
    interacoes: parceirosComInteracao.reduce((sum, p) => sum + (p.qtd_interacoes || 1), 0),
    contatados: parceirosContatadosUnicos.size,
  };
});

// Usa dados com ou sem filtro
const statusData = statusFiltro.length > 0 ? statusDataFiltrado : statusDataCompleto;

  
  

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Container fluid style={{ padding: 0, maxWidth: '100%' }}>
        <div style={{ padding: 20 }}>
          <Title order={2} mb="md" style={{ color: '#005A64' }}>
            {tipoUser === 'GESTOR' && 'Dashboard do Gestor'}
            {tipoUser === 'VENDEDOR' && 'Dashboard do Vendedor'}
            {tipoUser === 'ADMIN' && 'Dashboard do Administrador'}
          </Title>

          {/* Filtros */}
          <Group mb="xl" justify="space-between" style={{ width: '100%' }}>
            <MultiSelect
              data={STATUS_OPTIONS}
              label="Filtrar por Status"
              placeholder="Selecione status"
              value={statusFiltro}
              onChange={setStatusFiltro}
              style={{ flex: 1, marginRight: 10 }}
              searchable
            />
            <Button variant="light" color="red" onClick={() => setStatusFiltro([])}>
              Resetar Filtros
            </Button>
          </Group>
          <Group mb="xl" grow>
  <Select
    data={MESES}
    label="Mês"
    placeholder="Selecione"
    value={mesSelecionado}
    onChange={setMesSelecionado}
  />
  <Select
    data={ANOS}
    label="Ano"
    placeholder="Selecione"
    value={anoSelecionado}
    onChange={setAnoSelecionado}
  />
  <Button color="teal" variant="filled" onClick={fetchDashboardData}>
    Aplicar Filtro
  </Button>
</Group>

         
         
          
 {/* KPIs - Status */}
 <Title order={3} mb="sm">Parceiros Sem Faturamento por Status</Title>
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={statusData}>
    <XAxis dataKey="status" />
    <YAxis />
    <RechartsTooltip />
    <Bar dataKey="parceiros" fill="#228be6">
  <LabelList dataKey="parceiros" position="insideTop" fill="#fff" />
</Bar>
  </BarChart>
</ResponsiveContainer>




<Divider my="md" />


{/* Interações por Status */}
<Title order={3} mb="sm">Interações por Status</Title>
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={statusData}>
    <XAxis dataKey="status" />
    <YAxis />
    <RechartsTooltip />
    <Bar dataKey="interacoes" fill="#40c057">
  <LabelList dataKey="interacoes" position="insideTop" fill="#fff" />
</Bar>
  </BarChart>
</ResponsiveContainer>






<Divider my="md" />
<Title order={3} mb="sm">Parceiros Contatados por Status</Title>
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={statusData}>
    <XAxis dataKey="status" />
    <YAxis />
    <RechartsTooltip />
    <Bar dataKey="contatados" fill="#fab005">
  <LabelList dataKey="contatados" position="insideTop" fill="#000" />
</Bar>

  </BarChart>
</ResponsiveContainer>





<Divider my="md" />
<Title order={3} mb="sm">Resumo de Contato com Parceiros</Title>
<Grid mb="xl">
  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
    <Card shadow="md" padding="lg" radius="lg" withBorder>
      <Title order={4} style={{ textAlign: 'center' }}>Parceiros Contactados</Title>
      <Text size="xl" fw={700} style={{ textAlign: 'center' }}>
        {totalContatados}
      </Text>
    </Card>
  </Grid.Col>

  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
    <Card shadow="md" padding="lg" radius="lg" withBorder>
      <Title order={4} style={{ textAlign: 'center' }}>Carteira Total</Title>
      <Text size="xl" fw={700} style={{ textAlign: 'center' }}>
        {totalCarteira}
      </Text>
    </Card>
  </Grid.Col>

  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
    <Card shadow="md" padding="lg" radius="lg" withBorder>
      <Title order={4} style={{ textAlign: 'center' }}>% Contactado</Title>
      <Text size="xl" fw={700} style={{ textAlign: 'center' }}>
        {percentualContatado.toFixed(1)}%
      </Text>
    </Card>
  </Grid.Col>
</Grid>


<Title order={3} mb="sm">Distribuição de Status na Carteira Filtrada</Title>
<Grid mb="xl">
  {STATUS_ORDER.map(status => (
    <Grid.Col span={{ base: 12, sm: 6, md: 2 }} key={`percentual-${status}`}>
      <Card shadow="md" padding="lg" radius="lg" withBorder style={{ backgroundColor: '#ffffff' }}>
        <Title order={5} style={{ textAlign: 'center' }}>{STATUS_LABELS[status] || status}</Title>
        <Text size="xl" fw={700} style={{ textAlign: 'center' }}>
          {(percentualPorStatus[status] ?? 0).toFixed(1)}%
        </Text>
        <Text size="sm" style={{ textAlign: 'center', color: 'gray' }}>
          ({parceirosFiltrados.filter(p => p.status === status).length} de {totalCarteira})
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
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }} key={title}>
                <Card shadow="md" padding="lg" radius="lg" withBorder>
                  <Title order={4} style={{ textAlign: 'center' }}>{title}</Title>
                  <Text size="xl" fw={700} style={{ textAlign: 'center' }}>
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
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={title}>
                <Card shadow="md" padding="lg" radius="lg" withBorder>
                  <Title order={4} style={{ textAlign: 'center' }}>{title}</Title>
                  <Text size="xl" fw={700} style={{ textAlign: 'center' }}>
                    {kpis.find(k => k.title === title)?.value || '0%'}
                  </Text>
                </Card>
              </Grid.Col>
            ))}
          </Grid>

          <Divider my="lg" />

          {/* Gráficos */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
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

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" padding="lg" radius="lg" withBorder>
                <Title order={5} mb="md" style={{ color: '#005A64' }}>Distribuição de Status</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={kpis.filter(kpi => STATUS_ORDER.includes(kpi.title))}
                      dataKey="value"
                      nameKey="title"
                      outerRadius={100}
                      label
                    >
                      {STATUS_ORDER.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
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
            { title: "Parceiros com Interação", data: parceirosInteracoes, exportName: "parceiros_interacoes", exportarHistorico: true },
            { title: "Parceiros com Oportunidade", data: parceirosOportunidades, exportName: "parceiros_oportunidades" },
            { title: "Parceiros Pendentes", data: parceirosPendentes, exportName: "parceiros_pendentes" },
          ].map((section, index) => (
            <div key={index}>
              <Title order={3} mb="md">{section.title} ({section.data.length})</Title>
              <Card shadow="md" padding="md" radius="md" withBorder mb="lg">
                <Group justify="space-between" mb="sm">
                  <Button
                    variant="outline"
                    color="teal"
                    size="xs"
                    onClick={() => exportToExcel(section.data, section.exportName, section.exportarHistorico)}
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
                        <th style={{ textAlign: 'center' }}>Faturamento Total</th>
                        <th style={{ textAlign: 'center' }}>Última Interação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData(section.title, section.data).map((p: any, idx: number) => (
                        <tr key={idx}>
                          <td>{p.parceiro}</td>
                          <td>{p.status}</td>
                          <td style={{ textAlign: 'center' }}>
                            R$ {Number(p.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'center' }}>{p.ultima_interacao || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </ScrollArea>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                  <Pagination
                    value={pageMap[section.title] || 1}
                    onChange={(page) => handlePageChange(section.title, page)}
                    total={Math.ceil(section.data.length / recordsPerPage)}
                    size="sm"
                  />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </Container>
    </SidebarGestor>
  );
}
