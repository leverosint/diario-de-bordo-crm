import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Grid,
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
} from '@mantine/core';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList,

} from 'recharts';
import * as XLSX from 'xlsx';
import SidebarGestor from '../components/SidebarGestor';
import { Select } from '@mantine/core'; // ✅ Mantém aqui no topo


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
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' }, { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' }, { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

const ANOS = ['2024', '2025', '2026'].map(ano => ({ value: ano, label: ano }));


export default function Dashboard() {
  const navigate = useNavigate();
  const [consultores, setConsultores] = useState<{ value: string, label: string }[]>([]);
  const [consultorSelecionado, setConsultorSelecionado] = useState<string | null>(null);
  const [tipoUser, setTipoUser] = useState<string | null>(null);
  const [kpis, setKpis] = useState<any[]>([]);

  const [tabelaParceiros, setTabelaParceiros] = useState<any[]>([]);
  const [dadosFiltrados, setDadosFiltrados] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [parceirosContatadosStatus, setParceirosContatadosStatus] = useState<Record<string, number>>({}); // ✅ ADICIONE AQUI
  const [interacoesPorStatus, setInteracoesPorStatus] = useState<Record<string, number>>({});

  

  

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
    
        const [kpiRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/dashboard/kpis/?mes=${mes}&ano=${ano}`, { headers }),
        ]);
        
        setKpis(kpiRes.data.kpis);
        setParceirosContatadosStatus(kpiRes.data.parceiros_contatados_status || {});
        setInteracoesPorStatus(kpiRes.data.interacoes_status || {});
        setTabelaParceiros(kpiRes.data.parceiros || []);
        setDadosFiltrados(kpiRes.data.parceiros || []);
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
// 🟢 BUSCA CONSULTOR SOMENTE SE GESTOR OU ADMIN
if (usuario.tipo_user === 'GESTOR' || usuario.tipo_user === 'ADMIN') {
  const canalId = usuario.canais_venda?.[0]?.id;  // você pode expandir isso para multicanais se quiser

  if (canalId) {
    axios.get(`${import.meta.env.VITE_API_URL}/usuarios-por-canal/?canal_id=${canalId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const lista = res.data.map((u: any) => ({
        value: u.id_vendedor,
        label: `${u.username} (${u.id_vendedor})`
      }));
      setConsultores(lista);
    }).catch(console.error);
  }
}




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

  const parceirosFiltrados = consultorSelecionado
  ? dadosFiltrados.filter(p => String(p.consultor_id) === String(consultorSelecionado))
  : dadosFiltrados;

  

    
    
    // Recalcular interações por status com base nos parceiros filtrados
const interacoesStatusFiltrado: Record<string, number> = {};
const parceirosContatadosStatusFiltrado: Record<string, number> = {};

for (const parceiro of parceirosFiltrados) {
  if (parceiro.tem_interacao) {
    interacoesStatusFiltrado[parceiro.status] = (interacoesStatusFiltrado[parceiro.status] || 0) + (parceiro.qtd_interacoes || 1);
    parceirosContatadosStatusFiltrado[parceiro.status] = (parceirosContatadosStatusFiltrado[parceiro.status] || 0) + 1;
  }
}


  
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


  const statusDataCompleto = STATUS_ORDER.map(status => {
    const parceirosDoStatus = tabelaParceiros.filter(p => p.status === status);
    return {
      status: STATUS_LABELS[status] || status,
      parceiros: parceirosDoStatus.length,
    };
  });


  // Adicione dentro do componente Dashboard, DEPOIS de const parceirosFiltrados...
const statsEtapas = resumoEtapas.map(({ etapa, key, cor }) => {
  // Se a sua lista correta é tabelaParceiros, pode usar ela mesmo. Se for outro array, troque aqui!
  const oportunidades = (tabelaParceiros || []).filter((item) => {
    // Se precisar, troque o campo para o nome correto, ex: item.status
    return (item.etapa || '').toLowerCase() === key;
  });
  return {
    etapa,
    cor,
    qtd: oportunidades.length,
    valor: oportunidades.reduce((soma, item) => soma + (Number(item.valor) || 0), 0),
  };
});






// Usa dados com ou sem filtro



  
  

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Container fluid style={{ padding: 0, maxWidth: '100%' }}>
        <div style={{ padding: 20 }}>
          <Title order={2} mb="md" style={{ color: '#005A64' }}>
            {tipoUser === 'GESTOR' && 'Dashboard do Gestor'}
            {tipoUser === 'VENDEDOR' && 'Dashboard do Vendedor'}
            {tipoUser === 'ADMIN' && 'Dashboard do Administrador'}
          </Title>

         
         


         
         
          
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

<Group grow style={{ marginBottom: 32 }}>
         
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
         {['GESTOR', 'ADMIN'].includes(tipoUser || '') && (
           <Select
             data={consultores}
             label="Consultor"
             placeholder="Selecione"
             value={consultorSelecionado}
             onChange={setConsultorSelecionado}
             searchable
           />
         )}
         <Button color="teal" variant="filled" onClick={fetchDashboardData}>
           Aplicar Filtro
         </Button>
       </Group>


       <Divider style={{ marginTop: 16, marginBottom: 16 }} />


{/* Interações por Status */}
<Title order={3} mb="sm">Interações por Status</Title>
<ResponsiveContainer width="100%" height={300}>
<BarChart
  data={STATUS_ORDER.map(status => ({
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
<Title order={3} mb="sm">Parceiros Contatados por Status</Title>
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={STATUS_ORDER.map(status => ({
    status: STATUS_LABELS[status] || status,
    contatados: parceirosContatadosStatus[status] || 0,
  }))}>
    <XAxis dataKey="status" />
    <YAxis />
    <RechartsTooltip />
    <Bar dataKey="contatados" fill="#fab005">
      <LabelList dataKey="contatados" position="insideTop" fill="#fff" />
    </Bar>
  </BarChart>
</ResponsiveContainer>





<Divider style={{ marginTop: 16, marginBottom: 16 }} />
<Title order={3} mb="sm">Resumo de Contato com Parceiros</Title>
<Grid style={{ marginBottom: 32 }}>
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
<Grid style={{ marginBottom: 32 }}>
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




<Divider style={{ marginTop: 24, marginBottom: 24 }} />

          

          {/* KPIs - Indicadores */}
          <Title order={3} mb="sm">Indicadores de Atividades e Resultados</Title>
          <Grid style={{ marginBottom: 32 }}>
  {['Interações', 'Oportunidades', 'Valor Gerado'].map(title => (
    <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={title}>
      <Card shadow="md" padding="lg" radius="lg" withBorder>
        <Title order={4} style={{ textAlign: 'center' }}>{title}</Title>
        <Text size="xl" fw={700} style={{ textAlign: 'center' }}>
          {kpis.find(k => k.title === title)?.value || 0}
        </Text>
      </Card>
    </Grid.Col>
  ))}
</Grid>


<Divider style={{ marginTop: 24, marginBottom: 24 }} />

          {/* KPIs - Taxas */}
          <Title order={3} mb="sm">Taxas de Conversão por Etapa</Title>
<Group mt="md" mb="xl" grow>
  {[
    { title: 'Taxa Interação > Oportunidade', cor: '#005A64' },
    { title: 'Taxa Oportunidade > Orçamento', cor: '#22b8cf' },
    { title: 'Taxa Orçamento > Pedido', cor: '#13862A' },
  ].map(({ title, cor }) => (
    <Card
      key={title}
      shadow="md"
      padding="lg"
      radius="lg"
      withBorder
      style={{
        minWidth: 280,
        maxWidth: 340,
        textAlign: 'center',
        margin: 8,
        boxShadow: '0 2px 16px 0 #00000010',
        border: 'none'
      }}
    >
      <Title order={4} style={{ color: cor, fontWeight: 700, marginBottom: 6 }}>
        {title}
      </Title>
      <Text size="xl" fw={700} style={{ color: '#111', marginTop: 8 }}>
        {kpis.find(k => k.title === title)?.value || '0%'}
      </Text>
    </Card>
  ))}
</Group>


          <Divider style={{ marginTop: 24, marginBottom: 24 }} />

          <Title order={3} mb="sm" mt={24}>Resumo das Etapas Comerciais</Title>
<Group mt="md" mb="xl" grow>
  {statsEtapas.map(({ etapa, cor, qtd, valor }) => (
    <Card
      key={etapa}
      shadow="md"
      padding="lg"
      radius="lg"
      withBorder
      style={{
        minWidth: 280,
        maxWidth: 340,
        textAlign: 'center',
        margin: 8,
        boxShadow: '0 2px 16px 0 #00000010',
        border: 'none'
      }}
    >
      <Title order={4} style={{ color: cor, fontWeight: 700, marginBottom: 6 }}>
        {etapa}
      </Title>
      <Text size="xl" fw={700} style={{ color: '#111', marginBottom: 2 }}>{qtd}</Text>
      <Text size="sm" color="dimmed" mb={6}>Qtd.</Text>
      <Text size="lg" fw={600} style={{ color: cor }}>
        {valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </Text>
      <Text size="sm" color="dimmed">Valor Total</Text>
    </Card>
  ))}
</Group>




          

          {/* Tabelas */}
          <Divider style={{ marginTop: 24, marginBottom: 24 }} />
          {[
  { title: "Todos os Parceiros", data: parceirosFiltrados, exportName: "parceiros" },
].map((section, index) => (
  <div key={index}>
    <Title order={3} mb="md">
      {section.title} ({section.data.length})
    </Title>
    <Card shadow="md" padding="md" radius="md" withBorder mb="lg">
      <Group justify="space-between" style={{ marginBottom: 16 }}>
        <Button
          variant="outline"
          color="teal"
          size="xs"
          onClick={() =>
            exportToExcel(
              section.data,
              section.exportName,
         
            )
          }
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
                  R${' '}
                  {Number(p.total || 0).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {p.ultima_interacao || '-'}
                </td>
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
