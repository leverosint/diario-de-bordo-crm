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
import type {
  KPI,
  ResumoParceiroMensal,
  DashboardKPIResponse,
  ConsultorOption,
} from '../types/dashboard';

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
        border: 'none',
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
  const [consultores, setConsultores] = useState<ConsultorOption[]>([]);
  const [consultorSelecionado, setConsultorSelecionado] = useState<string | null>(null);
  const [tipoUser, setTipoUser] = useState<string | null>(null);
  
  // Estados para dados do backend
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [dadosResumo, setDadosResumo] = useState<ResumoParceiroMensal[]>([]);
  const [statusGeral, setStatusGeral] = useState<Record<string, number>>({});
  const [interacoesPorStatus, setInteracoesPorStatus] = useState<Record<string, number>>({});
  const [parceirosContatadosStatus, setParceirosContatadosStatus] = useState<Record<string, number>>({});
  
  const [loading, setLoading] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState<string | null>('6');
  const [anoSelecionado, setAnoSelecionado] = useState<string | null>('2025');
  const [pageMap, setPageMap] = useState<{ [key: string]: number }>({});
  
  const recordsPerPage = 10;
  const token = localStorage.getItem('token');

  // Fetch dados do backend
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const mes = mesSelecionado || String(new Date().getMonth() + 1);
      const ano = anoSelecionado || String(new Date().getFullYear());

      // Buscar dados dos KPIs gerais (status da carteira)
      const kpiResponse = await axios.get<DashboardKPIResponse>(
        `${import.meta.env.VITE_API_URL}/dashboard/kpis/?mes=${mes}&ano=${ano}`,
        { headers }
      );

      // Buscar resumo mensal dos parceiros
      const resumoResponse = await axios.get<ResumoParceiroMensal[]>(
        `${import.meta.env.VITE_API_URL}/dashboard/resumo-parceiros/?mes=${mes}&ano=${ano}`,
        { headers }
      );

      // Aplicar filtro de consultor se selecionado
      let dadosResumoFiltrados = resumoResponse.data;
      if (consultorSelecionado) {
        dadosResumoFiltrados = dadosResumoFiltrados.filter(
          (item) => item.consultor === consultorSelecionado
        );
      }

      // Salvar dados nos estados
      setKpis(kpiResponse.data.kpis);
      setStatusGeral(kpiResponse.data.parceiros_sem_fat_status);
      setInteracoesPorStatus(kpiResponse.data.interacoes_status);
      setParceirosContatadosStatus(kpiResponse.data.parceiros_contatados_status);
      setDadosResumo(dadosResumoFiltrados);

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar consultores para filtro
  const fetchConsultores = async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '');
      if (usuario.tipo_user === 'GESTOR' || usuario.tipo_user === 'ADMIN') {
        const canalId = usuario.canais_venda?.[0]?.id;
        if (canalId) {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/usuarios-por-canal/?canal_id=${canalId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const lista = response.data.map((u: any) => ({
            value: u.id_vendedor,
            label: `${u.username} (${u.id_vendedor})`,
          }));
          setConsultores(lista);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar consultores:', error);
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
      fetchConsultores();
      fetchDashboardData();
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      navigate('/');
    }
  }, [token, navigate, mesSelecionado, anoSelecionado, consultorSelecionado]);

  // Funções de cálculo baseadas nos dados do backend
  const calcularKPIsContato = () => {
    const totalParceiros = dadosResumo.length;
    const parceirosContatados = dadosResumo.filter(p => p.total_interacoes > 0).length;
    const percentualContatado = totalParceiros > 0 ? (parceirosContatados / totalParceiros) * 100 : 0;

    return {
      totalParceiros,
      parceirosContatados,
      percentualContatado,
    };
  };

  const calcularDistribuicaoStatus = () => {
    const distribuicao: Record<string, number> = {};
    const total = dadosResumo.length;

    STATUS_ORDER.forEach(status => {
      const count = dadosResumo.filter(p => p.status_parceiro === status).length;
      distribuicao[status] = total > 0 ? (count / total) * 100 : 0;
    });

    return distribuicao;
  };

  const calcularEtapasComerciais = () => {
    return [
      {
        etapa: 'Oportunidade',
        cor: '#0A5A64',
        qtd: dadosResumo.reduce((sum, item) => sum + item.oportunidades_oportunidade, 0),
        valor: dadosResumo.reduce((sum, item) => sum + (item.valor_total_oportunidades || 0), 0),
      },
      {
        etapa: 'Orçamento',
        cor: '#2CA5A9',
        qtd: dadosResumo.reduce((sum, item) => sum + item.oportunidades_orcamento, 0),
        valor: dadosResumo.reduce((sum, item) => sum + (item.valor_total_oportunidades || 0), 0),
      },
      {
        etapa: 'Pedido',
        cor: '#13862A',
        qtd: dadosResumo.reduce((sum, item) => sum + item.oportunidades_pedido, 0),
        valor: dadosResumo.reduce((sum, item) => sum + (item.valor_total_oportunidades || 0), 0),
      },
    ];
  };

  // Funções auxiliares
  const getPaginatedData = (key: string, data: any[]) => {
    const page = pageMap[key] || 1;
    const startIndex = (page - 1) * recordsPerPage;
    return data.slice(startIndex, startIndex + recordsPerPage);
  };

  const handlePageChange = (key: string, page: number) => {
    setPageMap(prev => ({ ...prev, [key]: page }));
  };

  const exportToExcel = (data: ResumoParceiroMensal[], fileName: string) => {
    const wb = XLSX.utils.book_new();
    const sheetData = data.map(item => ({
      Código: item.codigo,
      Parceiro: item.parceiro,
      Consultor: item.consultor,
      Unidade: item.unidade,
      Status: item.status_parceiro,
      'Total Interações': item.total_interacoes,
      'Total Oportunidades': item.total_oportunidades,
      'Valor Total': item.valor_total_oportunidades,
      'Orçamentos': item.oportunidades_orcamento,
      'Pedidos': item.oportunidades_pedido,
    }));
    
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Resumo Parceiros');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

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

  // Cálculos baseados nos dados do backend
  const kpisContato = calcularKPIsContato();
  const distribuicaoStatus = calcularDistribuicaoStatus();
  const etapasComerciais = calcularEtapasComerciais();

  // Dados para gráficos
  const statusDataCompleto = STATUS_ORDER.map(status => ({
    status: STATUS_LABELS[status] || status,
    parceiros: statusGeral[status] || 0,
  }));

  const interacoesStatusData = STATUS_ORDER.map(status => ({
    status: STATUS_LABELS[status] || status,
    interacoes: interacoesPorStatus[status] || 0,
  }));

  const contatadosStatusData = STATUS_ORDER.map(status => ({
    status: STATUS_LABELS[status] || status,
    contatados: parceirosContatadosStatus[status] || 0,
  }));

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

          {/* Gráfico - Status Geral da Carteira */}
          <Title order={3} mb="sm">
            Status Geral da Carteira
          </Title>
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

          {/* Gráfico - Interações por Status */}
          <Title order={3} mb="sm">
            Interações por Status
          </Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={interacoesStatusData}>
              <XAxis dataKey="status" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="interacoes" fill="#40c057">
                <LabelList dataKey="interacoes" position="insideTop" fill="#fff" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <Divider style={{ marginTop: 16, marginBottom: 16 }} />

          {/* Gráfico - Parceiros Contatados por Status */}
          <Title order={3} mb="sm">
            Parceiros Contatados por Status
          </Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contatadosStatusData}>
              <XAxis dataKey="status" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="contatados" fill="#fab005">
                <LabelList dataKey="contatados" position="insideTop" fill="#fff" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <Divider style={{ marginTop: 24, marginBottom: 24 }} />

          {/* KPIs de Contato */}
          <Title order={3} mb="sm">
            Resumo de Contato com Parceiros
          </Title>
          <Group mt="md" mb="xl" justify="center" grow>
            <CardPadrao
              titulo="Parceiros Contactados"
              valor={kpisContato.parceirosContatados}
              cor="#0A5A64"
              minWidth={220}
            />
            <CardPadrao
              titulo="Carteira Total"
              valor={kpisContato.totalParceiros}
              cor="#0A5A64"
              minWidth={220}
            />
            <CardPadrao
              titulo="% Contactado"
              valor={kpisContato.percentualContatado.toFixed(1) + '%'}
              cor="#0A5A64"
              minWidth={220}
            />
          </Group>

          <Divider style={{ marginTop: 24, marginBottom: 24 }} />

          {/* Distribuição de Status */}
          <Title order={3} mb="sm">
            Distribuição de Status na Carteira Filtrada
          </Title>
          <Group mt="md" mb="xl" justify="center" grow>
            {STATUS_ORDER.map(status => (
              <CardPadrao
                key={`percentual-${status}`}
                titulo={STATUS_LABELS[status] || status}
                valor={(distribuicaoStatus[status] ?? 0).toFixed(1) + '%'}
                cor="#0A5A64"
                minWidth={180}
                maxWidth={220}
              >
                <Text size="sm" style={{ textAlign: 'center', color: 'gray' }}>
                  ({dadosResumo.filter(p => p.status_parceiro === status).length} de {dadosResumo.length})
                </Text>
              </CardPadrao>
            ))}
          </Group>

          <Divider style={{ marginTop: 24, marginBottom: 24 }} />

          {/* KPIs Gerais */}
          <Title order={3} mb="sm">
            Indicadores de Atividades e Resultados
          </Title>
          <Group mt="md" mb="xl" justify="center" grow>
            {['Interações', 'Oportunidades', 'Valor Gerado'].map(title => (
              <CardPadrao
                key={title}
                titulo={title}
                valor={kpis.find(k => k.title === title)?.value || 0}
                cor="#0A5A64"
                minWidth={220}
              />
            ))}
          </Group>

          <Divider style={{ marginTop: 24, marginBottom: 24 }} />

          {/* Taxas de Conversão */}
          <Title order={3} mb="sm">
            Taxas de Conversão por Etapa
          </Title>
          <Group mt="md" mb="xl" justify="center" grow>
            {['Taxa Interação > Oportunidade', 'Taxa Oportunidade > Orçamento', 'Taxa Orçamento > Pedido'].map(title => (
              <CardPadrao
                key={title}
                titulo={title}
                valor={kpis.find(k => k.title === title)?.value || '0%'}
                cor="#0A5A64"
                minWidth={220}
              />
            ))}
          </Group>

          <Divider style={{ marginTop: 24, marginBottom: 24 }} />

          {/* Etapas Comerciais */}
          <Title order={3} mb="sm">
            Resumo das Etapas Comerciais
          </Title>
          <Group mt="md" mb="xl" justify="center" grow>
            {etapasComerciais.map(({ etapa, cor, qtd, valor }) => (
              <Card
                key={etapa}
                shadow="md"
                padding="lg"
                radius="lg"
                withBorder
                style={{ minWidth: 180, textAlign: 'center', borderBottom: `4px solid ${cor}` }}
              >
                <Title order={4} style={{ color: cor, marginBottom: 8 }}>
                  {etapa}
                </Title>
                <Text size="xl" fw={700} style={{ marginBottom: 2 }}>
                  {qtd}
                </Text>
                <Text size="sm" color="dimmed" mb={6}>
                  Qtd.
                </Text>
                <Text size="lg" fw={600} style={{ color: cor }}>
                  {valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
                <Text size="sm" color="dimmed">
                  Valor Total
                </Text>
              </Card>
            ))}
          </Group>

          <Divider style={{ marginTop: 24, marginBottom: 24 }} />

          {/* Tabela Resumo Mensal */}
          <Title order={3} mb="md">
            Resumo Mensal dos Parceiros ({dadosResumo.length})
          </Title>
          <Card shadow="md" padding="md" radius="md" withBorder mb="lg">
            <Group justify="space-between" style={{ marginBottom: 16 }}>
              <Button
                variant="outline"
                color="teal"
                size="xs"
                onClick={() => exportToExcel(dadosResumo, 'resumo-mensal-parceiros')}
              >
                Exportar Excel
              </Button>
            </Group>
            <ScrollArea>
              <Table striped highlightOnHover withColumnBorders>
                <thead style={{ backgroundColor: '#f1f3f5' }}>
                  <tr>
                    <th>Código</th>
                    <th>Parceiro</th>
                    <th>Consultor</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Interações</th>
                    <th style={{ textAlign: 'center' }}>Oportunidades</th>
                    <th style={{ textAlign: 'center' }}>Valor Total</th>
                    <th style={{ textAlign: 'center' }}>Orçamentos</th>
                    <th style={{ textAlign: 'center' }}>Pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedData('resumo-mensal', dadosResumo).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.codigo}</td>
                      <td>{item.parceiro}</td>
                      <td>{item.consultor}</td>
                      <td>{item.status_parceiro}</td>
                      <td style={{ textAlign: 'center' }}>{item.total_interacoes}</td>
                      <td style={{ textAlign: 'center' }}>{item.total_oportunidades}</td>
                      <td style={{ textAlign: 'center' }}>
                        {item.valor_total_oportunidades.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.oportunidades_orcamento}</td>
                      <td style={{ textAlign: 'center' }}>{item.oportunidades_pedido}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </ScrollArea>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
              <Pagination
                value={pageMap['resumo-mensal'] || 1}
                onChange={(page) => handlePageChange('resumo-mensal', page)}
                total={Math.ceil(dadosResumo.length / recordsPerPage)}
                size="sm"
              />
            </div>
          </Card>
        </div>
      </Container>
    </SidebarGestor>
  );
}