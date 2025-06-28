import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Card,
  Title,
  Text,
  Loader,
  Divider,
  Table,
  ScrollArea,
  Button,
  Group,
  Container,
  Pagination,
  Select,
} from '@mantine/core';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import * as XLSX from 'xlsx';
import SidebarGestor from '../components/SidebarGestor';

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

const resumoEtapas = [
  { etapa: 'Oportunidade', key: 'oportunidade', cor: '#0A5A64' },
  { etapa: 'Orçamento', key: 'orcamento', cor: '#2CA5A9' },
  { etapa: 'Pedido', key: 'pedido', cor: '#13862A' },
];

const MESES = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const ANOS = ['2024', '2025', '2026'].map((ano) => ({ value: ano, label: ano }));

function CardPadrao({
  titulo,
  valor,
  subtitulo,
  valorSub,
  children,
  minWidth = 180,
  maxWidth = 280,
  cor = '#0A5A64',
}: {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  valorSub?: string;
  children?: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  cor?: string;
}) {
  return (
    <Card
      shadow="md"
      padding="lg"
      radius="lg"
      withBorder
      style={{
        minWidth,
        maxWidth,
        textAlign: 'center',
        margin: 8,
        boxShadow: '0 2px 16px 0 #00000010',
        borderBottom: `4px solid ${cor}`,
      }}
    >
      <Title order={4} style={{ color: cor, marginBottom: 6 }}>
        {titulo}
      </Title>
      <Text size="xl" fw={700} style={{ marginBottom: 2 }}>
        {valor}
      </Text>
      {subtitulo && (
        <Text size="sm" color="dimmed" mb={6}>
          {subtitulo}
        </Text>
      )}
      {valorSub && (
        <Text size="lg" fw={600} style={{ color: cor }}>
          {valorSub}
        </Text>
      )}
      {children}
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [consultores, setConsultores] = useState<{ value: string; label: string }[]>([]);
  const [consultorSelecionado, setConsultorSelecionado] = useState<string | null>(null);
  const [tipoUser, setTipoUser] = useState<string | null>(null);
  const [dados, setDados] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [oportunidades, setOportunidades] = useState<any[]>([]);
const [loadingOportunidades, setLoadingOportunidades] = useState(true);
const [resumoParceiros, setResumoParceiros] = useState<any[]>([]);
const [loadingResumoParceiros, setLoadingResumoParceiros] = useState(true);

  const [mesSelecionado, setMesSelecionado] = useState<string | null>('6');
  const [anoSelecionado, setAnoSelecionado] = useState<string | null>('2025');

  const [pageMap, setPageMap] = useState<{ [key: string]: number }>({});
  const recordsPerPage = 5;

  const token = localStorage.getItem('token');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const mes = mesSelecionado || String(new Date().getMonth() + 1);
      const ano = anoSelecionado || String(new Date().getFullYear());
      const consultorParam = consultorSelecionado ? `&consultor=${consultorSelecionado}` : '';
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/dashboard/kpis/?mes=${mes}&ano=${ano}${consultorParam}`,
  { headers }
);
  
      setKpis(res.data.kpis);
      setDados(res.data.parceiros || []);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };


  
const fetchOportunidades = async () => {
  try {
    setLoadingOportunidades(true);
    const headers = { Authorization: `Bearer ${token}` };
    const params = [
      mesSelecionado ? `mes=${mesSelecionado}` : '',
      anoSelecionado ? `ano=${anoSelecionado}` : '',
      consultorSelecionado ? `consultor=${consultorSelecionado}` : ''
    ].filter(Boolean).join('&');
    const url = `${import.meta.env.VITE_API_URL}/oportunidades/?${params}`;

    const res = await axios.get(url, { headers });
    setOportunidades(res.data.results || res.data); // depende do seu backend (se paginado ou não)
  } catch (err) {
    console.error('Erro ao buscar oportunidades:', err);
    setOportunidades([]);
  } finally {
    setLoadingOportunidades(false);
  }
};






const fetchResumoParceiros = async () => {
  try {
    setLoadingResumoParceiros(true);
    const headers = { Authorization: `Bearer ${token}` };
    const params = [
      mesSelecionado ? `mes=${mesSelecionado}` : '',
      anoSelecionado ? `ano=${anoSelecionado}` : '',
      consultorSelecionado ? `consultor=${consultorSelecionado}` : ''
    ].filter(Boolean).join('&');
    const url = `${import.meta.env.VITE_API_URL}/dashboard/resumo-parceiros/?${params}`;
    const res = await axios.get(url, { headers });
    setResumoParceiros(res.data.results || res.data); // paginado ou não
  } catch (err) {
    setResumoParceiros([]);
  } finally {
    setLoadingResumoParceiros(false);
  }
};


  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const usuario = JSON.parse(localStorage.getItem('usuario') || '');
    if (!usuario?.tipo_user) {
      navigate('/');
      return;
    }

    setTipoUser(usuario.tipo_user);

    if (usuario.tipo_user === 'GESTOR' || usuario.tipo_user === 'ADMIN') {
      const canalId = usuario.canais_venda?.[0]?.id;

      if (canalId) {
        axios
          .get(`${import.meta.env.VITE_API_URL}/usuarios-por-canal/?canal_id=${canalId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            const lista = res.data.map((u: any) => ({
              value: u.id_vendedor,
              label: `${u.username} (${u.id_vendedor})`,
            }));
            setConsultores(lista);
          })
          .catch(console.error);
      }
    }

    fetchDashboardData();
  fetchOportunidades();
  fetchResumoParceiros(); // <-- ADICIONE AQUI
}, [token, navigate, mesSelecionado, anoSelecionado, consultorSelecionado]);

  if (!token || !tipoUser) return null;
  if (loading || loadingOportunidades || loadingResumoParceiros) {
    return (
      <SidebarGestor tipoUser={tipoUser}>
        <div style={{ padding: 20 }}>
          <Loader />
        </div>
      </SidebarGestor>
    );
  }
  

  

  

  const parceirosFiltrados = dados;


  const totalCarteira = parceirosFiltrados.length;
  const totalContatados = parceirosFiltrados.filter((p) => p.tem_interacao).length;
  const percentualContatado = totalCarteira > 0 ? (totalContatados / totalCarteira) * 100 : 0;

  const percentualPorStatus: Record<string, number> = {};
  STATUS_ORDER.forEach((status) => {
    const count = parceirosFiltrados.filter((p) => p.status === status).length;
    percentualPorStatus[status] = totalCarteira > 0 ? (count / totalCarteira) * 100 : 0;
  });

  const statusDataCompleto = STATUS_ORDER.map((status) => {
    const parceirosDoStatus = parceirosFiltrados.filter((p) => p.status === status);
    return {
      status: STATUS_LABELS[status] || status,
      parceiros: parceirosDoStatus.length,
    };
  });

  const interacoesPorStatus = STATUS_ORDER.reduce((acc, status) => {
    const parceiros = parceirosFiltrados.filter((p) => p.status === status && p.tem_interacao);
    acc[status] = parceiros.reduce((soma, p) => soma + (p.qtd_interacoes || 1), 0);
    return acc;
  }, {} as Record<string, number>);

  const parceirosContatadosStatus = STATUS_ORDER.reduce((acc, status) => {
    const parceiros = parceirosFiltrados.filter((p) => p.status === status && p.tem_interacao);
    acc[status] = parceiros.length;
    return acc;
  }, {} as Record<string, number>);

  const statsEtapas = resumoEtapas.map(({ etapa, key, cor }) => {
    const itens = oportunidades.filter((item) => (item.etapa || '').toLowerCase() === key);
    return {
      etapa,
      cor,
      qtd: itens.length,
      valor: itens.reduce((soma, item) => soma + (Number(item.valor) || 0), 0),
    };
  });
  

  const getPaginatedData = (key: string, data: any[]) => {
    const page = pageMap[key] || 1;
    const startIndex = (page - 1) * recordsPerPage;
    return data.slice(startIndex, startIndex + recordsPerPage);
  };

  const handlePageChange = (key: string, page: number) => {
    setPageMap((prev) => ({ ...prev, [key]: page }));
  };

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
          <Group grow style={{ marginBottom: 32 }}>
            <Select data={MESES} label="Mês" value={mesSelecionado} onChange={setMesSelecionado} />
            <Select data={ANOS} label="Ano" value={anoSelecionado} onChange={setAnoSelecionado} />
            {['GESTOR', 'ADMIN'].includes(tipoUser || '') && (
              <Select
                data={consultores}
                label="Consultor"
                value={consultorSelecionado}
                onChange={setConsultorSelecionado}
                searchable
              />
            )}
            <Button color="teal" onClick={fetchDashboardData}>
              Aplicar Filtro
            </Button>
          </Group>

          {/* KPIs - Status */}
<Title order={3} mb="sm">Parceiros Sem Faturamento por Status</Title>
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={statusDataCompleto}>
    <XAxis dataKey="status" />
    <YAxis />
    <RechartsTooltip />
    <Bar dataKey="parceiros" fill="#228be6">
      <LabelList dataKey="parceiros" position="insideTop" fill="#fff" />
    </Bar>
  </BarChart>
</ResponsiveContainer>

<Divider style={{ marginTop: 16, marginBottom: 16 }} />

{/* Interações por Status */}
<Title order={3} mb="sm">Interações por Status</Title>
<ResponsiveContainer width="100%" height={300}>
  <BarChart
    data={STATUS_ORDER.map((status) => ({
      status: STATUS_LABELS[status] || status,
      interacoes: interacoesPorStatus[status] || 0,
    }))}
  >
    <XAxis dataKey="status" />
    <YAxis />
    <RechartsTooltip />
    <Bar dataKey="interacoes" fill="#40c057">
      <LabelList dataKey="interacoes" position="insideTop" fill="#fff" />
    </Bar>
  </BarChart>
</ResponsiveContainer>

<Divider style={{ marginTop: 16, marginBottom: 16 }} />

{/* Parceiros Contatados por Status */}
<Title order={3} mb="sm">Parceiros Contatados por Status</Title>
<ResponsiveContainer width="100%" height={300}>
  <BarChart
    data={STATUS_ORDER.map((status) => ({
      status: STATUS_LABELS[status] || status,
      contatados: parceirosContatadosStatus[status] || 0,
    }))}
  >
    <XAxis dataKey="status" />
    <YAxis />
    <RechartsTooltip />
    <Bar dataKey="contatados" fill="#fab005">
      <LabelList dataKey="contatados" position="insideTop" fill="#fff" />
    </Bar>
  </BarChart>
</ResponsiveContainer>

<Divider style={{ marginTop: 24, marginBottom: 24 }} />

{/* Resumo de Contato */}
<Title order={3} mb="sm">Resumo de Contato com Parceiros</Title>
<Group mt="md" mb="xl" justify="center" grow>
  <CardPadrao titulo="Parceiros Contactados" valor={totalContatados} cor="#0A5A64" minWidth={220} />
  <CardPadrao titulo="Carteira Total" valor={totalCarteira} cor="#0A5A64" minWidth={220} />
  <CardPadrao titulo="% Contactado" valor={percentualContatado.toFixed(1) + '%'} cor="#0A5A64" minWidth={220} />
</Group>

{/* Distribuição de Status */}
<Title order={3} mb="sm">Distribuição de Status na Carteira Filtrada</Title>
<Group mt="md" mb="xl" justify="center" grow>
  {STATUS_ORDER.map((status) => (
    <CardPadrao
      key={`percentual-${status}`}
      titulo={STATUS_LABELS[status] || status}
      valor={(percentualPorStatus[status] ?? 0).toFixed(1) + '%'}
      cor="#0A5A64"
      minWidth={180}
      maxWidth={220}
    >
      <Text size="sm" style={{ textAlign: 'center', color: 'gray' }}>
        ({parceirosFiltrados.filter((p) => p.status === status).length} de {totalCarteira})
      </Text>
    </CardPadrao>
  ))}
</Group>

<Divider style={{ marginTop: 24, marginBottom: 24 }} />

{/* Indicadores de Atividades e Resultados */}
<Title order={3} mb="sm">Indicadores de Atividades e Resultados</Title>
<Group mt="md" mb="xl" justify="center" grow>
  {['Interações', 'Oportunidades', 'Valor Gerado'].map((title) => (
    <CardPadrao
      key={title}
      titulo={title}
      valor={kpis.find((k) => k.title === title)?.value || 0}
      cor="#0A5A64"
      minWidth={220}
    />
  ))}
</Group>

<Divider style={{ marginTop: 24, marginBottom: 24 }} />

{/* Taxas de Conversão */}
<Title order={3} mb="sm">Taxas de Conversão por Etapa</Title>
<Group mt="md" mb="xl" justify="center" grow>
  {['Taxa Interação > Oportunidade', 'Taxa Oportunidade > Orçamento', 'Taxa Orçamento > Pedido'].map((title) => (
    <CardPadrao
      key={title}
      titulo={title}
      valor={kpis.find((k) => k.title === title)?.value || '0%'}
      cor="#0A5A64"
      minWidth={220}
    />
  ))}
</Group>

<Divider style={{ marginTop: 24, marginBottom: 24 }} />

{/* Resumo das Etapas Comerciais */}
<Title order={3} mb="sm">Resumo das Etapas Comerciais</Title>
<Group mt="md" mb="xl" justify="center" grow>
  {statsEtapas.map(({ etapa, cor, qtd, valor }) => (
    <Card
      key={etapa}
      shadow="md"
      padding="lg"
      radius="lg"
      withBorder
      style={{ minWidth: 180, textAlign: 'center', borderBottom: `4px solid ${cor}` }}
    >
      <Title order={4} style={{ color: cor, marginBottom: 8 }}>{etapa}</Title>
      <Text size="xl" fw={700} style={{ marginBottom: 2 }}>{qtd}</Text>
      <Text size="sm" color="dimmed" mb={6}>Qtd.</Text>
      <Text size="lg" fw={600} style={{ color: cor }}>
        {valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </Text>
      <Text size="sm" color="dimmed">Valor Total</Text>
    </Card>
  ))}
</Group>

<Divider style={{ marginTop: 24, marginBottom: 24 }} />

{/* Tabela */}
<Title order={3} mb="md">Todos os Parceiros ({parceirosFiltrados.length})</Title>
<Card shadow="md" padding="md" radius="md" withBorder mb="lg">
  <Group justify="space-between" style={{ marginBottom: 16 }}>
    <Button
      variant="outline"
      color="teal"
      size="xs"
      onClick={() => {
        const wb = XLSX.utils.book_new();
        const sheetData = resumoParceiros.map((p) => ({
          Parceiro: p.parceiro,
          Status: p.status,
          'Faturamento Total': p.total || p.total_faturamento,
          'Última Interação': p.ultima_interacao || '-',
          'Dias sem Interação': p.dias_sem_interacao !== undefined ? `${p.dias_sem_interacao} dias` : '-',
        }));
        const ws = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, 'Resumo Parceiros');
        XLSX.writeFile(wb, `parceiros.xlsx`);
      }}
    >
      Exportar Excel
    </Button>
  </Group>
  <ScrollArea>
  <Table striped highlightOnHover withColumnBorders>
  <thead>
    <tr>
      <th>Parceiro</th>
      <th>Status</th>
      <th style={{ textAlign: 'center' }}>Faturamento Total</th>
      <th style={{ textAlign: 'center' }}>Última Interação</th>
      <th style={{ textAlign: 'center' }}>Dias sem Interação</th>
    </tr>
  </thead>
  <tbody>
    {getPaginatedData('Todos os Parceiros', parceirosFiltrados).map((p, idx) => (
      <tr key={idx}>
        <td>{p.parceiro}</td>
        <td>{p.status}</td>
        <td style={{ textAlign: 'center' }}>
          R$ {Number(p.total || p.total_faturamento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </td>
        <td style={{ textAlign: 'center' }}>
          {p.ultima_interacao || '-'}
        </td>
        <td style={{ textAlign: 'center' }}>
          {p.dias_sem_interacao !== undefined ? `${p.dias_sem_interacao} dias` : '-'}
        </td>
      </tr>
    ))}
  </tbody>
</Table>

  </ScrollArea>
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
  <Pagination
  value={pageMap['Todos os Parceiros'] || 1}
  onChange={(page) => handlePageChange('Todos os Parceiros', page)}
  total={Math.ceil(resumoParceiros.length / recordsPerPage)}
  size="sm"
/>
  </div>
</Card>


        </div>
      </Container>
    </SidebarGestor>
  );
}