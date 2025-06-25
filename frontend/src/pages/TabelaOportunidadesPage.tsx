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
  const fetchDados = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/oportunidades/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDados(res.data);
    } catch (err) {
      console.error('Erro ao buscar oportunidades:', err);
    } finally {
      setCarregando(false);
    }
  };
  fetchDados();
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
          <TextInput
            label="Nome do parceiro"
            placeholder="Filtrar por nome"
            value={nomeFiltro}
            onChange={(e) => setNomeFiltro(e.currentTarget.value)}
          />
       <Select
  label="Gatilho"
  placeholder="Todos"
  data={[{ value: '', label: 'Todos' }, ...gatilhoOptions]}
  value={filtroGatilho}
  onChange={(v) => setFiltroGatilho(v ?? '')}  // transforma null em ''
  clearable
/>

          <Select
            label="Status"
            placeholder="Todos"
            value={etapaFiltro}
            onChange={setEtapaFiltro}
            data={etapaOptions}
            clearable
          />
{[
          { label: 'Data início', value: dataInicio, onChange: setDataInicio },
          { label: 'Data fim',    value: dataFim,    onChange: setDataFim },
        ].map((item, idx) => (
          <Box key={idx} style={{ minWidth: 160 }}>
            <DatePickerInput
              label={item.label}
              placeholder={`Selecione ${item.label.toLowerCase()}`}
              value={item.value}
              onChange={item.onChange}
              locale="pt-br"
              dropdownType="popover"
              clearable

              /* remove o ícone do lado direito */
              rightSection={null}

              /* largura do popover em px */
              popoverProps={{ width: 370 }}

              /* formata a data no input */
              valueFormat="DD/MM/YYYY"

              /* estilização opcional do input/label */
              classNames={{
                input: styles.datePickerInput,
                label: styles.datePickerLabel,
              }}
            />
          </Box>
        ))}
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
                    <Table striped highlightOnHover withColumnBorders>
  <thead>
    <tr>
      <th className={styles.center}>ID</th>
      <th className={styles.left}>Parceiro</th>
      <th className={styles.center}>Valor</th>
      <th className={styles.center}>Data Criação</th>
      <th className={styles.center}>Data Etapa</th>
      <th className={styles.center}>Gatilho</th>
      <th className={styles.left}>Observação</th>
      <th className={styles.center}>Sem Movimentação</th>
      <th className={styles.center}>Nº Pedido</th>
      <th className={styles.center}>Status</th>
    </tr>
  </thead>
  <tbody>
    {lista.map((o) => {
      const emEdicao = editandoId === o.id;
      return (
        <tr key={o.id}>
          <td className={styles.center}>{o.id}</td>
          <td className={styles.left}>{o.parceiro_nome}</td>
          <td className={styles.center}>
            {emEdicao ? (
              <TextInput
                value={valorEdit}
                onChange={(e) => setValorEdit(e.currentTarget.value)}
                size="xs"
              />
            ) : (
              <>R$ {Number(o.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
            )}
          </td>
          <td className={styles.center}>
            {new Date(o.data_criacao).toLocaleDateString('pt-BR')}
          </td>
          <td className={styles.center}>
            {o.data_etapa ? new Date(o.data_etapa).toLocaleDateString('pt-BR') : '-'}
          </td>
          <td className={styles.center}>{o.gatilho_extra || '-'}</td>
          <td className={styles.left}>
            {emEdicao ? (
              <TextInput
                value={observacaoEdit}
                onChange={(e) => setObservacaoEdit(e.currentTarget.value)}
                size="xs"
              />
            ) : (
              o.observacao || '-'
            )}
          </td>
          <td className={styles.center}>
            {typeof o.dias_sem_movimentacao === 'number'
              ? `${o.dias_sem_movimentacao} dia${o.dias_sem_movimentacao === 1 ? '' : 's'}`
              : '-'}
          </td>
          <td className={styles.center}>
  {emEdicao ? (
    <TextInput
      value={numeroPedidoEdit}
      onChange={(e) => setNumeroPedidoEdit(e.currentTarget.value)}
      size="xs"
    />
  ) : (
    o.numero_pedido || '-'
  )}
</td>
          {/* --------- SELECT DE STATUS COM FILTRO DE FLUXO -------- */}
          <td className={styles.center}>
            <Group gap="xs" justify="center">
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
                    minWidth: 120,
                  },
                }}
              />
              {emEdicao ? (
                <>
                  <Button size="xs" color="green" onClick={() => salvarEdicao(o.id)}>
                    <Save size={16} />
                  </Button>
                  <Button size="xs" variant="outline" color="red" onClick={cancelarEdicao}>
                    <X size={16} />
                  </Button>
                </>
              ) : (
                <Button size="xs" variant="outline" onClick={() => iniciarEdicao(o)}>
                  <Pencil size={16} />
                </Button>
              )}
            </Group>
          </td>
        </tr>
      );
    })}
  </tbody>

                      </Table>
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