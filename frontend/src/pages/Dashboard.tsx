import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Card, Title, Text, Loader, Divider, Table, ScrollArea, Button, Group, Container, Pagination,
} from '@mantine/core';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';

import SidebarGestor from '../components/SidebarGestor';
import { Select } from '@mantine/core';

// ======================= CONSTANTES =========================
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
  { etapa: 'Oportunidade', key: 'oportunidades_oportunidade', cor: '#0A5A64' },
  { etapa: 'Orçamento', key: 'oportunidades_orcamento', cor: '#2CA5A9' },
  { etapa: 'Pedido', key: 'oportunidades_pedido', cor: '#13862A' },
];
const MESES = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' }, { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' }, { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];
const ANOS = ['2024', '2025', '2026'].map(ano => ({ value: ano, label: ano }));

function CardPadrao({
  titulo,
  valor,
  subtitulo,
  valorSub,
  children,
  minWidth = 180,
  maxWidth = 280,
  cor = '#0A5A64'
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
        borderBottom: `4px solid ${cor}`
      }}
    >
      <Title order={4} style={{ color: cor, marginBottom: 6 }}>{titulo}</Title>
      <Text size="xl" fw={700} style={{ marginBottom: 2 }}>{valor}</Text>
      {subtitulo && <Text size="sm" color="dimmed" mb={6}>{subtitulo}</Text>}
      {valorSub && <Text size="lg" fw={600} style={{ color: cor }}>{valorSub}</Text>}
      {children}
    </Card>
  );
}






// ======================= COMPONENTE PRINCIPAL =========================
export default function Dashboard() {
  const navigate = useNavigate();
  const [consultores, setConsultores] = useState<{ value: string, label: string }[]>([]);
  const [consultorSelecionado, setConsultorSelecionado] = useState<string | null>(null);
  const [tipoUser, setTipoUser] = useState<string | null>(null);
  const [dadosResumo, setDadosResumo] = useState<any[]>([]);
  const [statusGeral, setStatusGeral] = useState<{ status: string, parceiros: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState<string | null>('6');
  const [anoSelecionado, setAnoSelecionado] = useState<string | null>('2025');
  const [pageMap, setPageMap] = useState<{ [key: string]: number }>({});
  const recordsPerPage = 5;
  const token = localStorage.getItem('token');
    const exportToExcel = async (data: any[], fileName: string, exportarHistorico = false) => {

  // ============== BUSCAS ==============
  const fetchResumoDashboard = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const mes = mesSelecionado || String(new Date().getMonth() + 1);
      const ano = anoSelecionado || String(new Date().getFullYear());
      let url = `${import.meta.env.VITE_API_URL}/dashboard/resumo-parceiros/?mes=${mes}&ano=${ano}`;
      if (consultorSelecionado) {
        url += `&consultor=${consultorSelecionado}`;
      }
      const res = await axios.get(url, { headers });
      setDadosResumo(res.data);
    } catch (err) {
      setDadosResumo([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusGeral = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/dashboard/kpis/`, { headers });
      const statusData = STATUS_ORDER.map(status => ({
        status: STATUS_LABELS[status] || status,
        parceiros: res.data.kpis.find((k: any) => k.title === status)?.value || 0,
      }));
      setStatusGeral(statusData);
    } catch (err) {
      setStatusGeral([]);
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

      if (usuario.tipo_user === 'GESTOR' || usuario.tipo_user === 'ADMIN') {
        const canalId = usuario.canais_venda?.[0]?.id;
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
      fetchResumoDashboard();
      fetchStatusGeral();
    } catch (error) {
      navigate('/');
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchResumoDashboard();
    // eslint-disable-next-line
  }, [mesSelecionado, anoSelecionado, consultorSelecionado]);

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

  // ============ KPIs & DADOS DERIVADOS ==============
  const dadosFiltrados = consultorSelecionado
    ? dadosResumo.filter(p => String(p.consultor) === String(consultorSelecionado))
    : dadosResumo;

  const totalInteracoes = dadosFiltrados.reduce((soma, p) => soma + (p.total_interacoes || 0), 0);
  const totalOportunidades = dadosFiltrados.reduce((soma, p) => soma + (p.total_oportunidades || 0), 0);
  const totalOrcamentos = dadosFiltrados.reduce((soma, p) => soma + (p.oportunidades_orcamento || 0), 0);
  const totalPedidos = dadosFiltrados.reduce((soma, p) => soma + (p.oportunidades_pedido || 0), 0);
  const valorTotal = dadosFiltrados.reduce((soma, p) => soma + (Number(p.valor_total_oportunidades) || 0), 0);

  
  const taxaInteracaoOportunidade = totalInteracoes > 0 ? (totalOportunidades / totalInteracoes) * 100 : 0;
  const taxaOportunidadeOrcamento = totalOportunidades > 0 ? (totalOrcamentos / totalOportunidades) * 100 : 0;
  const taxaOrcamentoPedido = totalOrcamentos > 0 ? (totalPedidos / totalOrcamentos) * 100 : 0;

  const interacoesPorStatus: Record<string, number> = {};
  for (const p of dadosFiltrados) {
    const status = p.status_parceiro || 'Sem Status';
    interacoesPorStatus[status] = (interacoesPorStatus[status] || 0) + (p.total_interacoes || 0);
  }
  const parceirosContatadosStatus: Record<string, number> = {};
  for (const p of dadosFiltrados) {
    const status = p.status_parceiro || 'Sem Status';
    if ((p.total_interacoes || 0) > 0) {
      parceirosContatadosStatus[status] = (parceirosContatadosStatus[status] || 0) + 1;
    }
  }
  const totalCarteira = dadosFiltrados.length;
  const totalContatados = Object.values(parceirosContatadosStatus).reduce((a, b) => a + b, 0);
  const percentualContatado = totalCarteira > 0 ? (totalContatados / totalCarteira) * 100 : 0;
  const percentualPorStatus: Record<string, number> = {};
  STATUS_ORDER.forEach(status => {
    const count = dadosFiltrados.filter(p => p.status_parceiro === status).length;
    percentualPorStatus[status] = totalCarteira > 0 ? (count / totalCarteira) * 100 : 0;
  });

  // ============ KPIs DE ETAPA =============
  const statsEtapas = resumoEtapas.map(({ etapa, key, cor }) => {
    const qtd = dadosFiltrados.reduce((soma, p) => soma + (p[key] || 0), 0);
    const valor = etapa === 'Pedido'
      ? dadosFiltrados.reduce((soma, p) => soma + (Number(p.valor_total_oportunidades) || 0), 0)
      : 0;
    return { etapa, cor, qtd, valor };
  });

  // ============ PAGINAÇÃO ================
  const getPaginatedData = (key: string, data: any[]) => {
    const page = pageMap[key] || 1;
    const startIndex = (page - 1) * recordsPerPage;
    return data.slice(startIndex, startIndex + recordsPerPage);
  };
  const handlePageChange = (key: string, page: number) => {
    setPageMap(prev => ({ ...prev, [key]: page }));
  };



  
  // ============ RENDER ================
  const tabelaResumo = dadosFiltrados;

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Container fluid style={{ padding: 0, maxWidth: '100%' }}>
        <div style={{ padding: 20 }}>
          <Title order={2} mb="md" style={{ color: '#005A64' }}>
            {tipoUser === 'GESTOR' && 'Dashboard do Gestor'}
            {tipoUser === 'VENDEDOR' && 'Dashboard do Vendedor'}
            {tipoUser === 'ADMIN' && 'Dashboard do Administrador'}
          </Title>

          {/* GRÁFICO STATUS GERAL */}
          <Title order={3} mb="sm">Parceiros por Status (Carteira Geral)</Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusGeral}>
              <XAxis dataKey="status" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="parceiros" fill="#228be6">
                <LabelList dataKey="parceiros" position="insideTop" fill="#fff" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <Divider style={{ marginTop: 16, marginBottom: 16 }} />
          {/* FILTROS */}
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
            <Button color="teal" variant="filled" onClick={fetchResumoDashboard}>
              Aplicar Filtro
            </Button>
          </Group>
          <Divider style={{ marginTop: 16, marginBottom: 16 }} />

          {/* GRÁFICO: INTERAÇÕES POR STATUS */}
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

          {/* GRÁFICO: PARCEIROS CONTATADOS POR STATUS */}
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

          <Title order={3} mb="sm">Resumo de Contato com Parceiros</Title>
          <Group mt="md" mb="xl" justify="center" grow>
            <CardPadrao titulo="Parceiros Contactados" valor={totalContatados} cor="#0A5A64" minWidth={220} />
            <CardPadrao titulo="Carteira Total" valor={totalCarteira} cor="#0A5A64" minWidth={220} />
            <CardPadrao titulo="% Contactado" valor={percentualContatado.toFixed(1) + '%'} cor="#0A5A64" minWidth={220} />
          </Group>
          <Divider style={{ marginTop: 24, marginBottom: 24 }} />

          {/* DISTRIBUIÇÃO DE STATUS */}
          <Title order={3} mb="sm">Distribuição de Status na Carteira Filtrada</Title>
          <Group mt="md" mb="xl" justify="center" grow>
            {STATUS_ORDER.map(status => (
              <CardPadrao
                key={`percentual-${status}`}
                titulo={STATUS_LABELS[status] || status}
                valor={(percentualPorStatus[status] ?? 0).toFixed(1) + '%'}
                cor="#0A5A64"
                minWidth={180}
                maxWidth={220}
              >
                <Text size="sm" style={{ textAlign: 'center', color: 'gray' }}>
                  ({tabelaResumo.filter(p => p.status_parceiro === status).length} de {totalCarteira})
                </Text>
              </CardPadrao>
            ))}
          </Group>
          <Divider style={{ marginTop: 24, marginBottom: 24 }} />

          {/* INDICADORES DE ATIVIDADE */}
          <Title order={3} mb="sm">Indicadores de Atividades e Resultados</Title>
          <Group mt="md" mb="xl" justify="center" grow>
            <CardPadrao titulo="Interações" valor={totalInteracoes} cor="#0A5A64" minWidth={220} />
            <CardPadrao titulo="Oportunidades" valor={totalOportunidades} cor="#0A5A64" minWidth={220} />
            <CardPadrao titulo="Valor Gerado" valor={valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cor="#0A5A64" minWidth={220} />
          </Group>
          <Divider style={{ marginTop: 24, marginBottom: 24 }} />

          {/* KPIs DE TAXAS */}
          <Title order={3} mb="sm">Taxas de Conversão por Etapa</Title>
          <Group mt="md" mb="xl" justify="center" grow>
            <CardPadrao titulo="Taxa Interação > Oportunidade" valor={taxaInteracaoOportunidade.toFixed(1) + '%'} cor="#0A5A64" minWidth={220} />
            <CardPadrao titulo="Taxa Oportunidade > Orçamento" valor={taxaOportunidadeOrcamento.toFixed(1) + '%'} cor="#0A5A64" minWidth={220} />
            <CardPadrao titulo="Taxa Orçamento > Pedido" valor={taxaOrcamentoPedido.toFixed(1) + '%'} cor="#0A5A64" minWidth={220} />
          </Group>
          <Divider style={{ marginTop: 24, marginBottom: 24 }} />

          {/* ETAPAS COMERCIAIS */}
          <Title order={3} mb="sm" mt={24}>Resumo das Etapas Comerciais</Title>
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

          {/* TABELA PRINCIPAL */}
          <Title order={3} mb="md">
            Parceiros Resumo Mensal ({tabelaResumo.length})
          </Title>
          <Card shadow="md" padding="md" radius="md" withBorder mb="lg">
            <Group justify="space-between" style={{ marginBottom: 16 }}>
              <Button
                variant="outline"
                color="teal"
                size="xs"
                onClick={() => exportToExcel(tabelaResumo, 'parceiros_resumo')}
              >
                Exportar Excel
              </Button>
            </Group>
            <ScrollArea>
              <Table striped highlightOnHover withColumnBorders>
                <thead style={{ backgroundColor: '#f1f3f5' }}>
                  <tr>
                    <th>Parceiro</th>
                    <th>Consultor</th>
                    <th>Unidade</th>
                    <th>Status</th>
                    <th>Total Interações</th>
                    <th>Total Oportunidades</th>
                    <th>Valor Total Oportunidades</th>
                    <th>Orçamentos</th>
                    <th>Pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedData("ResumoMensal", tabelaResumo).map((p: any, idx: number) => (
                    <tr key={idx}>
                      <td>{p.parceiro}</td>
                      <td>{p.consultor}</td>
                      <td>{p.unidade}</td>
                      <td>{p.status_parceiro}</td>
                      <td style={{ textAlign: 'center' }}>{p.total_interacoes}</td>
                      <td style={{ textAlign: 'center' }}>{p.total_oportunidades}</td>
                      <td style={{ textAlign: 'center' }}>
                        R$ {(Number(p.valor_total_oportunidades) || 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td style={{ textAlign: 'center' }}>{p.oportunidades_orcamento}</td>
                      <td style={{ textAlign: 'center' }}>{p.oportunidades_pedido}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </ScrollArea>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
              <Pagination
                value={pageMap["ResumoMensal"] || 1}
                onChange={(page) => handlePageChange("ResumoMensal", page)}
                total={Math.ceil(tabelaResumo.length / recordsPerPage)}
                size="sm"
              />
            </div>
          </Card>
        </div>
      </Container>
    </SidebarGestor>
  );
}
