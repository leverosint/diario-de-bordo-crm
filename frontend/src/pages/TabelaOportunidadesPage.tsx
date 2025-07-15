import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Title, Table, Container, Loader, ScrollArea, Badge, Group,
  TextInput, Button, Tooltip, Card, Box, Select, Modal, Textarea
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import 'dayjs/locale/pt-br';
import * as XLSX from 'xlsx';
import SidebarGestor from '../components/SidebarGestor';
import type { DateValue } from '@mantine/dates';

import styles from './TabelaOportunidadesPage.module.css'; // ✅ CSS
import { Pagination } from '@mantine/core';

const etapaOptions = [
  { value: 'oportunidade', label: 'Oportunidade' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'aguardando', label: 'Aguardando Pagamento' },
  { value: 'pedido', label: 'Pedido Faturado' },
  { value: 'perdida', label: 'Venda Perdida' },
];



interface Oportunidade {
  id: number;
  parceiro: number;
  parceiro_nome: string;
  valor: number;
  etapa: string;
  data_criacao: string;
  data_status: string | null;
  numero_pedido?: string; // ✅ isso precisa estar aqui
  data_etapa: string | null; // <-- 🔥 Adiciona isso
  gatilho_extra?: string;
  observacao?: string;
  dias_sem_movimentacao?: number;
}

const getStatusColor = (etapa: string) => ({
  oportunidade: 'blue',
  orcamento: 'teal',
  aguardando: '#f59f00',
  pedido: 'green',
  perdida: 'red',
}[etapa] || 'gray');



export default function TabelaOportunidadesPage() {
 
  const [dados, setDados] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nomeFiltro, setNomeFiltro] = useState('');
  const [etapaFiltro, setEtapaFiltro] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState<DateValue>(null);
  const [dataFim, setDataFim] = useState<DateValue>(null);
 
  const [filtroVendedor, setFiltroVendedor] = useState<string>('');      // ID do consultor
const [filtroUnidade, setFiltroUnidade] = useState<string>('');        // ID do canal_venda
const [statusParceiroFiltro, setStatusParceiroFiltro] = useState<string | null>(null);

const [opcoesVendedores, setOpcoesVendedores] = useState<{value:string, label:string}[]>([]);
const [opcoesUnidades, setOpcoesUnidades] = useState<{value:string, label:string}[]>([]);
const [paginaAtual, setPaginaAtual] = useState(1);
const [totalPaginas, setTotalPaginas] = useState(1);
  const [popupAberto, setPopupAberto] = useState(false);
  
  const [pendentesMovimentacao, setPendentesMovimentacao] = useState<Oportunidade[]>([]);
  const [oportunidadeSelecionada, setOportunidadeSelecionada] = useState<Oportunidade | null>(null);
  const [filtroGatilho, setFiltroGatilho] = useState<string>('');
  
  const [idMudandoStatus, setIdMudandoStatus] = useState<number | null>(null);
const [modalAberto, setModalAberto] = useState(false);
const [motivoPerda, setMotivoPerda] = useState('');
const [numeroPedido, setNumeroPedido] = useState('');


  const abrirModalPerda = (id: number) => {
    setIdMudandoStatus(id);
    setMotivoPerda('');
    setModalAberto(true);
  };

  const abrirModalOportunidade = (o: Oportunidade) => {
    setOportunidadeSelecionada({ ...o });
  };

  const salvarOportunidade = async () => {
    if (!oportunidadeSelecionada) return;
  
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/oportunidades/${oportunidadeSelecionada.id}/`, {
        valor: oportunidadeSelecionada.valor,
        observacao: oportunidadeSelecionada.observacao,
        numero_pedido: oportunidadeSelecionada.numero_pedido,
        etapa: oportunidadeSelecionada.etapa,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      setDados(prev =>
        prev.map(o => o.id === oportunidadeSelecionada.id ? oportunidadeSelecionada : o)
      );
      setOportunidadeSelecionada(null);
    } catch (err) {
      console.error('Erro ao salvar oportunidade:', err);
      alert('Erro ao salvar oportunidade');
    }
  };

<Modal
  opened={popupAberto}
  onClose={() => {}} // Impede fechar manualmente
  withCloseButton={false}
  title="Oportunidades sem movimentação"
  centered
>
  <p>Você tem oportunidades sem movimentação há mais de 10 dias.<br />Atualize o status para continuar!</p>
  <ul style={{ listStyle: 'none', padding: 0 }}>
    {pendentesMovimentacao.map((o) => (
      <li key={o.id} style={{ marginBottom: 24 }}>
        <b>{o.parceiro_nome}</b> (ID: {o.id}) — <span style={{ color: '#e8590c', fontWeight: 600 }}>{o.dias_sem_movimentacao} dias parado</span>
        <Group mt="xs" gap="xs">
        <Select
  value={o.etapa}
  onChange={(value) => value && handleStatusChange(o.id, value)}
  data={etapaOptions}
  size="xs"
  styles={{
    input: {
      backgroundColor: getStatusColor(o.etapa),
      color: 'white',
      fontWeight: 600,
      textAlign: 'center',
      borderRadius: 6,
      minWidth: 120,
    },
  }}
/>
        </Group>
      </li>
    ))}
  </ul>
</Modal>

  
  const [etapaParaAtualizar, setEtapaParaAtualizar] = useState<string | null>(null);

  // extrai todas as strings de gatilho que realmente existem na lista
  const gatilhoOptions = useMemo(() => {
    const all = (dados || []).map((o) => o.gatilho_extra).filter((g): g is string => !!g);
    const unique = Array.from(new Set(all));
    return unique.map((g) => ({ value: g, label: g }));
  }, [dados]);

  const token = localStorage.getItem('token') ?? '';
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');




  const tipoUser = usuario?.tipo_user ?? '';

const handleCanalChange = async (canalId: string | null) => {
  setFiltroUnidade(canalId || '');
  setFiltroVendedor('');
  if (!canalId) {
    setOpcoesVendedores([]);
    return;
  }
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/usuarios-por-canal/?canal_id=${canalId}`,
      { headers }
    );
    setOpcoesVendedores(
      res.data.map((v: any) => ({ value: v.username, label: v.nome || v.username }))
    );
  } catch (err) {
    console.error('Erro ao carregar vendedores por canal:', err);
    setOpcoesVendedores([]);
  }
};

  

  

  const confirmarNumeroPedido = async () => {
    if (!idMudandoStatus || numeroPedido.trim() === '') {
      alert('Por favor, preencha o número do pedido.');
      return;
    }
    const agora = new Date().toISOString();
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/oportunidades/${idMudandoStatus}/`,
        {
          etapa: 'aguardando',
          numero_pedido: numeroPedido,
          data_etapa: agora,
          data_status: agora,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDados(prev =>
        prev.map(o =>
          o.id === idMudandoStatus
            ? { ...o, etapa: 'aguardando', numero_pedido: numeroPedido, data_etapa: agora, data_status: agora, dias_sem_movimentacao: 0 }
            : o
        )
      );
      setModalAberto(false);
      setIdMudandoStatus(null);
      setEtapaParaAtualizar(null);
      setNumeroPedido('');
    } catch (err) {
      console.error('Erro ao salvar número do pedido:', err);
      alert('Erro ao atualizar etapa.');
    }
  };
  

// 🔗 Carregar dados da API (mantém igual)
useEffect(() => {
  setCarregando(true);
  const params: any = { page: paginaAtual, page_size: 20 }; // ⭐️ define página e limite
  if (filtroVendedor) params.consultor = filtroVendedor;
  if (filtroUnidade)  params.canal_id = filtroUnidade;
  if (etapaFiltro) params.etapa = etapaFiltro;
  if (statusParceiroFiltro) params.status_parceiro = statusParceiroFiltro;
  if (filtroGatilho) params.gatilho = filtroGatilho;

  axios.get(`${import.meta.env.VITE_API_URL}/oportunidades/`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  })
  .then(res => {
    // Garante que dados nunca fique undefined
    setDados(res.data.results ?? res.data ?? []);
    const total = res.data.count || 1;
    setTotalPaginas(Math.ceil(total / 20));
  })
  
    .catch(() => setDados([]))
    .finally(() => setCarregando(false));
}, [token, filtroVendedor, filtroUnidade, etapaFiltro, statusParceiroFiltro, filtroGatilho, paginaAtual]);


useEffect(() => {
  // Vendedores
  axios.get(`${import.meta.env.VITE_API_URL}/usuarios/report/`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => {
    setOpcoesVendedores(res.data.map((u: any) => ({
      value: u.username,
      label: u.nome || u.username,
    })));
  });

  // Unidades (aqui está a alteração principal!)
  if (tipoUser === 'GESTOR') {
    // 👇 Carrega diretamente dos canais do usuário logado
    const canaisUsuario = usuario.canais_venda || [];
    setOpcoesUnidades(canaisUsuario.map((c: any) => ({
      value: c.id.toString(),
      label: c.nome,
    })));
  } else {
    // Para ADMIN ou outros tipos, mantém a busca original
    axios.get(`${import.meta.env.VITE_API_URL}/canais-venda/`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      setOpcoesUnidades(res.data.map((c: any) => ({
        value: c.id.toString(),
        label: c.nome,
      })));
    });
  }
}, [token, tipoUser]);

const dadosComDias: Oportunidade[] = useMemo(() => {
  const dadosCalculados = dados.map((o) => ({
    ...o,
    dias_sem_movimentacao: o.data_etapa
      ? Math.floor(
          (new Date().getTime() - new Date(o.data_etapa).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : undefined,
  }));

  console.log('📊 dadosComDias', dadosCalculados);

  return dadosCalculados;
}, [dados]);


// 🔥 Verificar se tem oportunidades sem movimentação
useEffect(() => {
  const oportunidadesPendentes = dadosComDias.filter(
    (o) => (o.dias_sem_movimentacao ?? 0) >= 10
  );
  

  if (oportunidadesPendentes.length > 0) {
    setPendentesMovimentacao(oportunidadesPendentes);
    setPopupAberto(true);
  }
}, [dadosComDias]);

// 2) depois o seu handleStatusChange, chamando atualizarEtapaDireta:
const handleStatusChange = (id: number, novaEtapa: string | null) => {
  if (!novaEtapa) return;

  if (novaEtapa === 'perdida') {
    abrirModalPerda(id);
    setEtapaParaAtualizar('perdida');
  } else if (novaEtapa === 'aguardando') {
    setIdMudandoStatus(id);
    setEtapaParaAtualizar('aguardando');
    setNumeroPedido('');
    setModalAberto(true);
  } else {
    const agora = new Date().toISOString();
    axios.patch(`${import.meta.env.VITE_API_URL}/oportunidades/${id}/`, {
      etapa: novaEtapa,
      data_etapa: agora,
      data_status: agora,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => {
      setDados(prev =>
        prev.map(o =>
          o.id === id
            ? { ...o, etapa: novaEtapa, data_status: agora, data_etapa: agora }
            : o
        )
      );
    }).catch(err => {
      console.error('Erro ao atualizar etapa:', err);
      alert('Erro ao atualizar etapa');
    });
  }
};







const confirmarVendaPerdida = async () => {
  if (!idMudandoStatus) {
    alert('ID inválido, tente novamente');
    return;
  }

  if (motivoPerda.trim() === '') {
    alert('Por favor, preencha o motivo da venda perdida.');
    return;
  }

  try {
    await axios.patch(
      `${import.meta.env.VITE_API_URL}/oportunidades/${idMudandoStatus}/`,
      {
        etapa: 'perdida',
        motivo_venda_perdida: motivoPerda,
        data_etapa: new Date().toISOString(),
        data_status: new Date().toISOString(),
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setDados(prev =>
      prev.map(o =>
        o.id === idMudandoStatus
          ? {
              ...o,
              etapa: 'perdida',
              observacao: motivoPerda,
              data_etapa: new Date().toISOString(),
              data_status: new Date().toISOString(),
              dias_sem_movimentacao: 0,
            }
          : o
      )
    );

    setPendentesMovimentacao(prev => {
      const atualizado = prev.filter(o => o.id !== idMudandoStatus);
      if (atualizado.length === 0) {
        setPopupAberto(false);
      }
      return atualizado;
    });

    setModalAberto(false);
    setMotivoPerda('');
    setEtapaParaAtualizar(null);
    setIdMudandoStatus(null);

  } catch (err) {
    console.error('Erro ao salvar motivo de perda:', err);
    alert('Erro ao atualizar etapa.');
  }
};

    


const dadosFiltrados = useMemo(() => {
  // zera as horas de hoje para comparar somente datas
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return dadosComDias.filter((o) => {
    // 1) filtros atuais: nome, etapa e data de criação
    const nomeMatch =
      nomeFiltro === '' ||
      o.parceiro_nome.toLowerCase().includes(nomeFiltro.toLowerCase());
    const etapaMatch = !etapaFiltro || o.etapa === etapaFiltro;
    const dataCriacao = new Date(o.data_criacao);
    const dataMatch =
      (!dataInicio || dataCriacao >= new Date(dataInicio as Date)) &&
      (!dataFim || dataCriacao <= new Date(dataFim as Date));
    if (!nomeMatch || !etapaMatch || !dataMatch) {
      return false;
    }

       // **AQUI o filtro de gatilho**:
       if (filtroGatilho !== '' && o.gatilho_extra !== filtroGatilho) {
        return false;
      }

    // 2) se for “perdida” ou “pedido”, só exibe no dia da própria data_etapa
    if ((o.etapa === 'perdida' || o.etapa === 'pedido') && o.data_etapa) {
      const dataEtapa = new Date(o.data_etapa);
      dataEtapa.setHours(0, 0, 0, 0);

      const diffDias = Math.floor(
        (hoje.getTime() - dataEtapa.getTime()) / (1000 * 60 * 60 * 24)
      );
      // já passou de hoje? remove do painel
      if (diffDias >= 1) {
        return false;
      }
    }

    // caso contrário, mantém no resultado
    return true;
  });
}, [dadosComDias, nomeFiltro, etapaFiltro, dataInicio, dataFim, filtroGatilho,]);



  const agrupadoPorStatus = useMemo((): Record<string, Oportunidade[]> => {
    const agrupado: Record<string, Oportunidade[]> = {};
    dadosFiltrados.forEach((item) => {
      const status = (item.etapa || 'Sem status').toLowerCase();
      if (!agrupado[status]) agrupado[status] = [];
      (agrupado[status] ||= []).push(item);

    });
    return agrupado;
  }, [dadosFiltrados]);

  const exportarExcel = () => {
    const linhas = dadosFiltrados.map(o => ({
      Parceiro: o.parceiro_nome,
      Valor: o.valor,
      Etapa: o.etapa,
      'Data Criação': new Date(o.data_criacao).toLocaleDateString('pt-BR'),
      'Data Status': o.data_status ? new Date(o.data_status).toLocaleDateString('pt-BR') : '-',
      Gatilho: o.gatilho_extra || '-',
      Observação: o.observacao || '-',
      'Sem Movimentação': o.dias_sem_movimentacao !== undefined ? `${o.dias_sem_movimentacao} dias` : '-',
    }));
    const worksheet = XLSX.utils.json_to_sheet(linhas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Oportunidades");
    XLSX.writeFile(workbook, "oportunidades.xlsx");
  };

  const calcularTempoMedio = (lista: Oportunidade[]) => {
    const dias = lista
      .filter(o => o.data_status !== null)
      .map(o => {
        const dataStatus = new Date(o.data_status!);
        const dataCriacao = new Date(o.data_criacao);
        return (dataStatus.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60 * 24);
      });
    if (dias.length === 0) return 0;
    return Math.round(dias.reduce((a, b) => a + b, 0) / dias.length);
  };

  

 

      
 


  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Container fluid style={{ maxWidth: '90vw', padding: '0 40px' }}>
        <Group justify="space-between" align="center" mt="md" mb="sm">
          <Title order={2}>Oportunidades por Status</Title>
          <Button onClick={exportarExcel} variant="light">
            Exportar Excel
          </Button>
        </Group>

        <Group mt="xs" mb="md" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
  <TextInput
    label="Nome do parceiro"
    placeholder="Filtrar por nome"
    value={nomeFiltro}
    onChange={(e) => setNomeFiltro(e.currentTarget.value)}
    style={{ flex: '1 1 200px', minWidth: 180 }}
  />
  
  <Select
    label="Gatilho"
    placeholder="Todos"
    data={[{ value: '', label: 'Todos' }, ...gatilhoOptions]}
    value={filtroGatilho}
    onChange={(v) => setFiltroGatilho(v ?? '')}
    clearable
    style={{ flex: '1 1 150px', minWidth: 150 }}
  />

  <Select
    label="Etapa"
    placeholder="Todas"
    data={etapaOptions}
    value={etapaFiltro}
    onChange={setEtapaFiltro}
    clearable
    style={{ flex: '1 1 150px', minWidth: 150 }}
  />

  <Select
    label="Status do Parceiro"
    placeholder="Todos"
    data={[
      { value: '', label: 'Todos' },
      { value: 'Sem Faturamento', label: 'Sem Faturamento' },
      { value: 'Base Ativa', label: 'Base Ativa' },
      { value: '30 dias s/ Fat', label: '30 dias s/ Fat' },
      { value: '60 dias s/ Fat', label: '60 dias s/ Fat' },
      { value: '90 dias s/ Fat', label: '90 dias s/ Fat' },
      { value: '120 dias s/ Fat', label: '120 dias s/ Fat' },
    ]}
    value={statusParceiroFiltro}
    onChange={setStatusParceiroFiltro}
    clearable
    style={{ flex: '1 1 180px', minWidth: 150 }}
  />

  {(tipoUser === 'GESTOR' || tipoUser === 'ADMIN') && (
    <>
      <Select
        label="Canal de Venda"
        placeholder="Selecione um canal"
        data={opcoesUnidades}
        value={filtroUnidade}
        onChange={handleCanalChange}
        clearable
        style={{ flex: '1 1 180px', minWidth: 150 }}
      />
      <Select
        label="Vendedor"
        placeholder="Selecione um vendedor"
        data={opcoesVendedores}
        value={filtroVendedor}
        onChange={v => setFiltroVendedor(v || '')}
        clearable
        disabled={!filtroUnidade}
        style={{ flex: '1 1 180px', minWidth: 150 }}
      />
    </>
  )}

  <DatePickerInput
    label="Data início"
    placeholder="Selecione data início"
    value={dataInicio}
    onChange={setDataInicio}
    locale="pt-br"
    dropdownType="popover"
    clearable
    popoverProps={{ width: 370 }}
    valueFormat="DD/MM/YYYY"
    style={{ flex: '1 1 160px', minWidth: 160 }}
  />

  <DatePickerInput
    label="Data fim"
    placeholder="Selecione data fim"
    value={dataFim}
    onChange={setDataFim}
    locale="pt-br"
    dropdownType="popover"
    clearable
    popoverProps={{ width: 370 }}
    valueFormat="DD/MM/YYYY"
    style={{ flex: '1 1 160px', minWidth: 160 }}
  />
</Group>


        {carregando ? (
          <Loader />
        ) : (
          <ScrollArea>
            {Object.entries(agrupadoPorStatus).map(([status, lista]) => {
              const valorTotal = lista.reduce((acc, o) => acc + Number(o.valor), 0);

              return (
                <Box key={status} mt="xl">
                  <Card
                    withBorder
                    shadow="sm"
                    radius="lg"
                    p="xl"
                    mb="lg"
                    style={{
                      borderLeft: `8px solid ${getStatusColor(status)}`,
                      backgroundColor: '#f9f9f9',
                      width: '100%',
                    }}
                  >
                    <Group justify="space-between" align="center" mb="sm">
                      <div>
                        <Title order={3}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Title>
                        <p style={{ fontSize: '0.9rem', color: '#555' }}>
                          Valor total:{' '}
                          {valorTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </p>
                      </div>
                      <Group>
                        <Badge color={getStatusColor(status)} variant="light">
                          {lista.length} oportunidades
                        </Badge>
                        <Tooltip label="Tempo médio até status" withArrow>
                          <Badge color="gray" variant="outline">
                            ⏱ {calcularTempoMedio(lista)} dias
                          </Badge>
                        </Tooltip>
                      </Group>
                    </Group>

                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    <Table
  className={styles.tableCard}
  striped
  highlightOnHover
  withColumnBorders
>
  <thead>
    <tr>
      <th style={{ width: '4%' }}>ID</th>
      <th className={styles.parceiro} style={{ width: '13%' }}>Parceiro</th>
      <th style={{ width: '8%' }}>Valor</th>
      <th style={{ width: '8%' }}>Data Criação</th>
      <th style={{ width: '8%' }}>Data Etapa</th>
      <th style={{ width: '8%' }}>Gatilho</th>
      <th className={styles.observacao} style={{ width: '19%' }}>Observação</th>
      <th style={{ width: '8%' }}>Sem Mov.</th>
      <th style={{ width: '9%' }}>Nº Pedido</th>
      <th className={styles.status} style={{ width: '15%' }}>Status</th>
    </tr>
  </thead>
  <tbody>
    {lista.map((o) => {
     
      return (
        <tr key={o.id} style={{ height: 44 }}>
          <td>{o.id}</td>
          <td className={styles.parceiro}>{o.parceiro_nome}</td>
          <td style={{ textAlign: 'right' }}>
          R$ {Number(o.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </td>
          <td>{new Date(o.data_criacao).toLocaleDateString('pt-BR')}</td>
          <td>{o.data_etapa ? new Date(o.data_etapa).toLocaleDateString('pt-BR') : '-'}</td>
          <td>{o.gatilho_extra || '-'}</td>
          <td className={styles.observacao}>
  <Tooltip label={o.observacao} multiline disabled={!o.observacao}>
    <span className={styles.ellipsis}>{o.observacao || '-'}</span>
  </Tooltip>
</td>
          <td>
            {typeof o.dias_sem_movimentacao === 'number'
              ? `${o.dias_sem_movimentacao} dia${o.dias_sem_movimentacao === 1 ? '' : 's'}`
              : '-'}
          </td>
          <td>
  {o.numero_pedido || '-'}
</td>
<td className={styles.status}>
  <Button
    size="xs"
    variant="outline"
    onClick={() => abrirModalOportunidade(o)}
    style={{ minWidth: 30, height: 32, padding: 2 }}
  >
    Editar
  </Button>
</td>

        </tr>
      );
    })}
  </tbody>
</Table>



</div>

                    </div>
                  </Card>
                </Box>
              );
            })}
          </ScrollArea>
        )}
      </Container>

      



      {modalAberto && idMudandoStatus !== null && (
  <div className={styles.modalOverlay}>
    <div className={styles.modalContent}>
      <h2>{etapaParaAtualizar === 'perdida' ? 'Marcar como Venda Perdida' : 'Informar Número do Pedido'}</h2>

      <div style={{ marginTop: 20 }}>
        {etapaParaAtualizar === 'perdida' ? (
          <select
            value={motivoPerda}
            onChange={(e) => setMotivoPerda(e.target.value)}
            style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
          >
            <option value="">Selecione o motivo</option>
            <option value="analise_credito_recusou">Análise de crédito recusou</option>
<option value="necessidade_entrada">Necessidade de entrada para pagamento a prazo</option>
<option value="condicao_parcelamento_prazo">Condição de parcelamento para pagamento a prazo</option>
<option value="cliente_desistiu_adiou">Cliente desistiu/adiou a compra</option>
<option value="sem_retorno">Sem retorno/não responde</option>
<option value="preco_margem_inviavel">Preço/Margem inviável</option>
<option value="falta_estoque">Falta de estoque</option>
<option value="prazo_entrega">Prazo de entrega</option>
<option value="problemas_pagamento">Problemas com pagamento</option>
<option value="valor_frete">Valor do frete</option>
<option value="condicao_parcelamento_cartao">Condição de parcelamento no cartão</option>
<option value="comprou_site_marketplace">Comprou no site/marketplace</option>
<option value="rt_diferenciada_concorrente">RT diferenciada do concorrente</option>
<option value="campanha_concorrente">Campanha do concorrente</option>


          </select>
        ) : (
          <input
            type="text"
            value={numeroPedido}
            onChange={(e) => setNumeroPedido(e.target.value)}
            placeholder="Número do Pedido"
            style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
          />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <button
          style={{ marginRight: 10, padding: '8px 20px', background: 'red', color: 'white', border: 'none', cursor: 'pointer' }}
          onClick={() => setModalAberto(false)}
        >
          Cancelar
        </button>
        <button
          style={{ padding: '8px 20px', background: 'green', color: 'white', border: 'none', cursor: 'pointer' }}
          onClick={etapaParaAtualizar === 'perdida' ? confirmarVendaPerdida : confirmarNumeroPedido}
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
)}

   
   {oportunidadeSelecionada && (
  <Modal
    opened={!!oportunidadeSelecionada}
    onClose={() => setOportunidadeSelecionada(null)}
    title="Editar Oportunidade"
    centered
    withinPortal={false}
    overlayProps={{
      backgroundOpacity: 0.55,
      blur: 4,
    }}
  >
    <div>
      <p><strong>Parceiro:</strong> {oportunidadeSelecionada.parceiro_nome}</p>
      <p><strong>Data Criação:</strong> {new Date(oportunidadeSelecionada.data_criacao).toLocaleDateString('pt-BR')}</p>
      <p><strong>Data Etapa:</strong> {oportunidadeSelecionada.data_etapa ? new Date(oportunidadeSelecionada.data_etapa).toLocaleDateString('pt-BR') : '-'}</p>
      <p><strong>Gatilho:</strong> {oportunidadeSelecionada.gatilho_extra || '-'}</p>
    </div>

    <TextInput
      label="Valor"
      value={oportunidadeSelecionada.valor}
      onChange={(e) =>
        setOportunidadeSelecionada({
          ...oportunidadeSelecionada,
          valor: Number(e.currentTarget.value),
        })
      }
      type="number"
      min={0}
    />

    <Textarea
      label="Observação"
      value={oportunidadeSelecionada.observacao || ''}
      onChange={(e) =>
        setOportunidadeSelecionada({
          ...oportunidadeSelecionada,
          observacao: e.currentTarget.value,
        })
      }
    />

    <TextInput
      label="Número do Pedido"
      value={oportunidadeSelecionada.numero_pedido || ''}
      onChange={(e) =>
        setOportunidadeSelecionada({
          ...oportunidadeSelecionada,
          numero_pedido: e.currentTarget.value,
        })
      }
    />

<Select
  label="Alterar Status"
  placeholder="Selecione um status"
  data={[
    { value: 'oportunidade', label: 'Oportunidade' },
    { value: 'orcamento', label: 'Orçamento' },
    { value: 'aguardando', label: 'Aguardando Pagamento' },
    { value: 'pedido', label: 'Pedido Faturado' },
    { value: 'perdida', label: 'Venda Perdida' },
  ]}
  value={oportunidadeSelecionada.etapa}
  onChange={(value) => {
    if (!value) return;
  
    if (value === 'perdida') {
      const nova = { ...oportunidadeSelecionada, etapa: 'perdida' };
      setIdMudandoStatus(oportunidadeSelecionada.id);
      setEtapaParaAtualizar('perdida');
  
      // Fecha Modal principal
      setOportunidadeSelecionada(null);
  
      // Guarda dados para reabrir depois
      setTimeout(() => {
        setOportunidadeSelecionada(nova);
        setModalAberto(true);
      }, 300);
  
      return;
    }
  
    if (value === 'aguardando') {
      const nova = { ...oportunidadeSelecionada, etapa: 'aguardando' };
      setIdMudandoStatus(oportunidadeSelecionada.id);
      setEtapaParaAtualizar('aguardando');
      setNumeroPedido('');
  
      // Fecha Modal principal
      setOportunidadeSelecionada(null);
  
      // Guarda dados para reabrir depois
      setTimeout(() => {
        setOportunidadeSelecionada(nova);
        setModalAberto(true);
      }, 300);
  
      return;
    }
  
    // Para outros casos, atualiza normalmente no modal principal
    setOportunidadeSelecionada({
      ...oportunidadeSelecionada,
      etapa: value,
    });
  }}
  
  
  clearable
/>


    <Group justify="flex-end" mt="md">
      <Button variant="outline" onClick={() => setOportunidadeSelecionada(null)}>
        Cancelar
      </Button>
      <Button onClick={salvarOportunidade}>Salvar</Button>
    </Group>
  </Modal>
)}

{totalPaginas > 1 && (
  <Group justify="center" mt="md">
    <Pagination
      total={totalPaginas}
      value={paginaAtual}
      onChange={setPaginaAtual}
      withEdges
    />
  </Group>
)}


    </SidebarGestor>
  );
}