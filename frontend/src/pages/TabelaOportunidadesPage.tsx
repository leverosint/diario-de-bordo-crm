import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Title, Table, Container, Loader, ScrollArea, Badge, Group,
  TextInput, Button, Tooltip, Card, Box, Select, Modal
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import 'dayjs/locale/pt-br';
import * as XLSX from 'xlsx';
import SidebarGestor from '../components/SidebarGestor';
import type { DateValue } from '@mantine/dates';
import { Pencil, Save, X } from 'lucide-react';
import styles from './TabelaOportunidadesPage.module.css'; // ✅ CSS




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

export default function TabelaOportunidadesPage() {
 
  const [dados, setDados] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nomeFiltro, setNomeFiltro] = useState('');
  const [etapaFiltro, setEtapaFiltro] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState<DateValue>(null);
  const [dataFim, setDataFim] = useState<DateValue>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [valorEdit, setValorEdit] = useState<string>('');
  const [observacaoEdit, setObservacaoEdit] = useState<string>('');
  const [numeroPedidoEdit, setNumeroPedidoEdit] = useState<string>('');
  const [filtroVendedor, setFiltroVendedor] = useState<string>('');      // ID do consultor
const [filtroUnidade, setFiltroUnidade] = useState<string>('');        // ID do canal_venda
const [statusParceiroFiltro, setStatusParceiroFiltro] = useState<string | null>(null);

const [opcoesVendedores, setOpcoesVendedores] = useState<{value:string, label:string}[]>([]);
const [opcoesUnidades, setOpcoesUnidades] = useState<{value:string, label:string}[]>([]);

  const [popupAberto, setPopupAberto] = useState(false);
  
  const [pendentesMovimentacao, setPendentesMovimentacao] = useState<Oportunidade[]>([]);
  
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
    const all = dados.map((o) => o.gatilho_extra).filter((g): g is string => !!g);
    const unique = Array.from(new Set(all));
    return unique.map((g) => ({ value: g, label: g }));
  }, [dados]);

  const token = localStorage.getItem('token') ?? '';
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const tipoUser = usuario?.tipo_user ?? '';

  const etapaOptions = [
    { value: 'oportunidade', label: 'Oportunidade' },
    { value: 'orcamento', label: 'Orçamento' },
    { value: 'aguardando', label: 'Aguardando Pagamento' },
    { value: 'pedido', label: 'Pedido Faturado' },
    { value: 'perdida', label: 'Venda Perdida' },
  ];

  const transicoesPermitidas: Record<string, string[]> = {
    oportunidade: ['orcamento', 'perdida'],
    orcamento: ['aguardando', 'perdida'],
    aguardando: ['pedido', 'perdida'],
    pedido: [],
    perdida: [],
  };

  const getStatusColor = (etapa: string) => ({
    oportunidade: 'blue',
    orcamento: 'teal',
    aguardando: '#f59f00',
    pedido: 'green',
    perdida: 'red',
  }[etapa] || 'gray');


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
  const params: any = {};
  if (filtroVendedor) params.consultor = filtroVendedor;
  if (filtroUnidade)  params.canal_id = filtroUnidade;

  axios.get(`${import.meta.env.VITE_API_URL}/oportunidades/`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  })
    .then(res => setDados(res.data))
    .catch(() => setDados([]))
    .finally(() => setCarregando(false));
}, [token, filtroVendedor, filtroUnidade]);

useEffect(() => {
  // Vendedores
  axios.get(`${import.meta.env.VITE_API_URL}/usuarios/report/`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => {
    setOpcoesVendedores(res.data.map((u: any) => ({
      value: u.username, // ou u.id_vendedor, veja o campo correto conforme seu backend!
      label: u.nome || u.username,
    })));
  });

  // Unidades
  axios.get(`${import.meta.env.VITE_API_URL}/canais-venda/`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => {
    setOpcoesUnidades(res.data.map((c: any) => ({
      value: c.id.toString(),
      label: c.nome,
    })));
  });
}, [token]);

const dadosComDias: Oportunidade[] = useMemo(() => {
  return dados.map((o) => ({
    ...o,
    dias_sem_movimentacao: o.data_etapa
      ? Math.floor(
          (new Date().getTime() - new Date(o.data_etapa).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : undefined,
  }));
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
    // Atualiza no back-end
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




    const confirmarVendaPerdida = async () => {
      if (!idMudandoStatus || motivoPerda.trim() === '') {
        alert('Por favor, preencha o motivo da perda.');
        return;
      }
    
      const agora = new Date().toISOString();
    
      try {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/oportunidades/${idMudandoStatus}/`,
          {
            etapa: 'perdida',
            observacao: motivoPerda,
            data_etapa: agora,
            data_status: agora,
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
                  data_etapa: agora,
                  data_status: agora,
                  dias_sem_movimentacao: 0,
                }
              : o
          )
        );
    
       
    
        setModalAberto(false);
        setMotivoPerda('');
        setEtapaParaAtualizar(null);
        setIdMudandoStatus(null);
      } catch (err) {
        console.error('Erro ao salvar motivo de perda:', err);
        alert('Erro ao atualizar etapa.');
      }
    };
    
    
    
   

    // Reflete no front-end em `dados`
    setDados(prev =>
      prev.map(o =>
        o.id === idMudandoStatus
          ? {
              ...o,
              etapa: 'perdida',
              data_status: new Date().toISOString(),
              observacao: motivoPerda,
              // se você quiser também zerar dias_sem_movimentacao:
              dias_sem_movimentacao: 0,
              data_etapa: new Date().toISOString(),
            }
          : o
      )
    );

    // Remove da lista de pendentes e fecha o popup quando zerar
    setPendentesMovimentacao(prev => {
      const atualizado = prev.filter(o => o.id !== idMudandoStatus);
      if (atualizado.length === 0) {
        setPopupAberto(false);
      }
      return atualizado;
    });



    // MODAL ADICIONAR PEDIDO AGUARDANDO PAGAMETNO

<Modal
  opened={modalAberto}
  onClose={() => setModalAberto(false)}
  title={
    etapaParaAtualizar === 'perdida'
      ? 'Motivo da Venda Perdida'
      : 'Informar Número do Pedido'
  }
  centered
  radius="md"
>
  {etapaParaAtualizar === 'perdida' ? (
    <>
      <TextInput
        label="Motivo da perda"
        value={motivoPerda}
        onChange={(e) => setMotivoPerda(e.currentTarget.value)}
        required
      />
      <Group justify="center" mt="md">
        <Button variant="outline" color="red" onClick={() => setModalAberto(false)}>
          Cancelar
        </Button>
        <Button color="green" onClick={confirmarVendaPerdida}>
          Confirmar
        </Button>
      </Group>
    </>
  ) : (
    <>
      <TextInput
        label="Número do Pedido"
        value={numeroPedido}
        onChange={(e) => setNumeroPedido(e.currentTarget.value)}
        required
      />
      <Group justify="center" mt="md">
        <Button variant="outline" color="red" onClick={() => setModalAberto(false)}>
          Cancelar
        </Button>
        <Button color="green" onClick={confirmarNumeroPedido}>
          Confirmar
        </Button>
      </Group>
    </>
  )}
</Modal>


    // Fecha modal e limpa estado
    setModalAberto(false);
    setIdMudandoStatus(null);
    setMotivoPerda('');
  } catch (err) {
    console.error('Erro ao atualizar etapa:', err);
    alert('Erro ao atualizar etapa');
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

  const iniciarEdicao = (o: Oportunidade) => {
    setEditandoId(o.id);
    setValorEdit(String(o.valor));
    setObservacaoEdit(o.observacao || '');
    setNumeroPedidoEdit(o.numero_pedido || ''); // <-- aqui
  };

  const salvarEdicao = async (id: number) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/oportunidades/${id}/`, {
        valor: parseFloat(valorEdit.replace(',', '.')) || 0,
        observacao: observacaoEdit,
        numero_pedido: numeroPedidoEdit, // <-- aqui
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDados(prev =>
        prev.map(o =>
          o.id === id ? { ...o, valor: parseFloat(valorEdit.replace(',', '.')) || 0, observacao: observacaoEdit } : o
        )
      );

      setEditandoId(null);
      setValorEdit('');
      setObservacaoEdit('');
    } catch (err) {
      console.error('Erro ao salvar edição:', err);
      alert('Erro ao salvar edição');
    }
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setValorEdit('');
    setObservacaoEdit('');
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

        <Group mt="xs" mb="md" grow align="end">
  {/* 1) Nome do parceiro */}
  <TextInput
    label="Nome do parceiro"
    placeholder="Filtrar por nome"
    value={nomeFiltro}
    onChange={(e) => setNomeFiltro(e.currentTarget.value)}
  />

  {/* 2) Filtro de Gatilho */}
  <Select
    label="Gatilho"
    placeholder="Todos"
    data={[{ value: '', label: 'Todos' }, ...gatilhoOptions]}
    value={filtroGatilho}
    onChange={(v) => setFiltroGatilho(v ?? '')}
    clearable
  />

  {/* 3) Filtro de Etapa */}
  <Select
    label="Etapa"
    placeholder="Todas"
    data={etapaOptions}
    value={etapaFiltro}
    onChange={setEtapaFiltro}
    clearable
  />

  {/* 4) Filtro de Status do Parceiro */}
  <Select
    label="Status do Parceiro"
    placeholder="Todos"
    data={[
      { value: '', label: 'Todos' },
      { value: 'Sem Faturamento', label: 'Sem Faturamento' },
      { value: 'Base Ativa',       label: 'Base Ativa' },
      { value: '30 dias s/ Fat',   label: '30 dias s/ Fat' },
      { value: '60 dias s/ Fat',   label: '60 dias s/ Fat' },
      { value: '90 dias s/ Fat',   label: '90 dias s/ Fat' },
      { value: '120 dias s/ Fat',  label: '120 dias s/ Fat' },
    ]}
    value={statusParceiroFiltro}
    onChange={setStatusParceiroFiltro}
    clearable
  />

  {/* 5) Canal de Venda → Vendedor */}
  {(tipoUser === 'GESTOR' || tipoUser === 'ADMIN') && (
    <Group gap="md">
      <Select
        label="Canal de Venda"
        placeholder="Selecione um canal"
        data={opcoesUnidades}
        value={filtroUnidade}
        onChange={(v) => {
          setFiltroUnidade(v || '');
          setFiltroVendedor(''); // limpa vendedor ao trocar canal
        }}
        clearable
        style={{ minWidth: 200 }}
      />
      <Select
        label="Vendedor"
        placeholder="Selecione um vendedor"
        data={opcoesVendedores}
        value={filtroVendedor}
        onChange={(v) => setFiltroVendedor(v || '')}
        clearable
        disabled={!filtroUnidade}
        style={{ minWidth: 200 }}
      />
    </Group>
  )}

  {/* 6) Data início / Data fim */}
  <Box style={{ minWidth: 160 }}>
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
      classNames={{
        input: styles.datePickerInput,
        label: styles.datePickerLabel,
      }}
    />
  </Box>

  <Box style={{ minWidth: 160 }}>
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
      classNames={{
        input: styles.datePickerInput,
        label: styles.datePickerLabel,
      }}
    />
  </Box>
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
      const emEdicao = editandoId === o.id;
      return (
        <tr key={o.id} style={{ height: 44 }}>
          <td>{o.id}</td>
          <td className={styles.parceiro}>{o.parceiro_nome}</td>
          <td style={{ textAlign: 'right' }}>
            {emEdicao ? (
              <TextInput
                value={valorEdit}
                onChange={(e) => setValorEdit(e.currentTarget.value)}
                size="xs"
                style={{ width: 90 }}
              />
            ) : (
              <>R$ {Number(o.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
            )}
          </td>
          <td>{new Date(o.data_criacao).toLocaleDateString('pt-BR')}</td>
          <td>{o.data_etapa ? new Date(o.data_etapa).toLocaleDateString('pt-BR') : '-'}</td>
          <td>{o.gatilho_extra || '-'}</td>
          <td className={styles.observacao}>
            {emEdicao ? (
              <TextInput
                value={observacaoEdit}
                onChange={(e) => setObservacaoEdit(e.currentTarget.value)}
                size="xs"
                style={{ width: '100%' }}
              />
            ) : (
              <Tooltip label={o.observacao} multiline disabled={!o.observacao}>
                <span className={styles.ellipsis}>{o.observacao || '-'}</span>
              </Tooltip>
            )}
          </td>
          <td>
            {typeof o.dias_sem_movimentacao === 'number'
              ? `${o.dias_sem_movimentacao} dia${o.dias_sem_movimentacao === 1 ? '' : 's'}`
              : '-'}
          </td>
          <td>
            {emEdicao ? (
              <TextInput
                value={numeroPedidoEdit}
                onChange={(e) => setNumeroPedidoEdit(e.currentTarget.value)}
                size="xs"
                style={{ width: 110 }}
              />
            ) : (
              o.numero_pedido || '-'
            )}
          </td>
          <td className={styles.status}>
            <div className={styles['botoes-status']}>
              <Select
                value={o.etapa}
                onChange={(value) => value && handleStatusChange(o.id, value)}
                data={etapaOptions.filter(opt =>
                  opt.value === o.etapa ||
                  transicoesPermitidas[o.etapa]?.includes(opt.value)
                )}
                size="xs"
                styles={{
                  input: {
                    backgroundColor: getStatusColor(o.etapa),
                    color: 'white',
                    fontWeight: 600,
                    textAlign: 'center',
                    borderRadius: 6,
                    minWidth: 90,
                    maxWidth: 120,
                    height: 32,
                    paddingRight: 20,
                  },
                }}
                style={{ width: 120 }}
                rightSectionWidth={28}
              />
              {emEdicao ? (
                <>
                  <Button size="xs" color="green" onClick={() => salvarEdicao(o.id)} style={{ minWidth: 30, height: 32, padding: 2 }}>
                    <Save size={14} />
                  </Button>
                  <Button size="xs" variant="outline" color="red" onClick={cancelarEdicao} style={{ minWidth: 30, height: 32, padding: 2 }}>
                    <X size={14} />
                  </Button>
                </>
              ) : (
                <Button size="xs" variant="outline" onClick={() => iniciarEdicao(o)} style={{ minWidth: 30, height: 32, padding: 2 }}>
                  <Pencil size={14} />
                </Button>
              )}
            </div>
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
  <Modal
    opened={modalAberto}
    onClose={() => setModalAberto(false)}
    title={etapaParaAtualizar === 'perdida' ? "Marcar como Venda Perdida" : "Informar Número do Pedido"}
    centered
    radius="md"
    withinPortal={false}
    overlayProps={{
      backgroundOpacity: 0.55,
      blur: 4,
    }}
  >
    <div className={styles.centralizado}>
      {etapaParaAtualizar === 'perdida' ? (
        <Select
          label="Motivo da Venda Perdida"
          placeholder="Selecione"
          data={[
            { value: 'preco', label: 'Preço' },
            { value: 'prazo', label: 'Prazo' },
            { value: 'concorrente', label: 'Fechou com concorrente' },
            { value: 'fora_perfil', label: 'Fora de perfil' },
            { value: 'nao_responde', label: 'Cliente não respondeu' },
            { value: 'outro', label: 'Outro' },
          ]}
          value={motivoPerda}
          onChange={(value) => setMotivoPerda(value ?? '')}
          required
          clearable
        />
      ) : (
        <TextInput
          label="Número do Pedido"
          value={numeroPedido}
          onChange={(e) => setNumeroPedido(e.currentTarget.value)}
          required
        />
      )}
    </div>
    <Group justify="center" mt="md">
      <Button variant="outline" color="red" onClick={() => setModalAberto(false)}>
        Cancelar
      </Button>
      <Button color="green" onClick={etapaParaAtualizar === 'perdida' ? confirmarVendaPerdida : confirmarNumeroPedido}>
        Confirmar
      </Button>
    </Group>
  </Modal>
)}
   


    </SidebarGestor>
  );
}