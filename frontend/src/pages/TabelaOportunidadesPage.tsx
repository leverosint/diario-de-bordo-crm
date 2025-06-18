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
  const [modalAberto, setModalAberto] = useState(false);
  const [idMudandoStatus, setIdMudandoStatus] = useState<number | null>(null);
  const [popupAberto, setPopupAberto] = useState(false);
  const [pendentesMovimentacao, setPendentesMovimentacao] = useState<Oportunidade[]>([]);
  const [motivoPerda, setMotivoPerda] = useState('');



  const abrirModalPerda = (id: number) => {
    setIdMudandoStatus(id);
    setMotivoPerda('');
    setModalAberto(true);
  };



  const token = localStorage.getItem('token') ?? '';
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const tipoUser = usuario?.tipo_user ?? '';

  const etapaOptions = [
    { value: 'oportunidade', label: 'Oportunidade' },
    { value: 'orcamento', label: 'Orçamento' },
    { value: 'aguardando', label: 'Aguardando Pagamento' },
    { value: 'pedido', label: 'Pedido Realizado' },
    { value: 'perdida', label: 'Venda Perdida' },
  ];

  const getStatusColor = (etapa: string) => ({
    oportunidade: 'blue',
    orcamento: 'teal',
    aguardando: '#f59f00',
    pedido: 'green',
    perdida: 'red',
  }[etapa] || 'gray');

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

// ✅ Calcular os dias sem movimentação SEM alterar o estado
const dadosComDias: Oportunidade[] = useMemo(() => {
  return dados.map((o) => ({
    ...o,
    dias_sem_movimentacao: o.data_status
    ? Math.floor(
        (new Date().getTime() - new Date(o.data_status).getTime()) /
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



  const handleStatusChange = (id: number, novaEtapa: string | null) => {
    if (!novaEtapa) return;

    if (novaEtapa === 'perdida') {
      abrirModalPerda(id);

    } else {
      axios.patch(`${import.meta.env.VITE_API_URL}/oportunidades/${id}/`, {
        etapa: novaEtapa,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(() => {
        setDados(prev =>
          prev.map(o =>
            o.id === id ? { ...o, etapa: novaEtapa, data_status: new Date().toISOString() } : o
          )
        );
      }).catch(err => {
        console.error('Erro ao atualizar etapa:', err);
        alert('Erro ao atualizar etapa');
      });
    }
  };



  const handleStatusChangePopup = (id: number, novaEtapa: string | null) => {
    if (!novaEtapa) return;

    axios.patch(`${import.meta.env.VITE_API_URL}/oportunidades/${id}/`, {
      etapa: novaEtapa,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => {
      setDados(prev =>
        prev.map(o =>
          o.id === id
            ? { ...o, etapa: novaEtapa, data_status: new Date().toISOString(), dias_sem_movimentacao: 0 }
            : o
        )
      );

      setPendentesMovimentacao(prev => prev.filter(o => o.id !== id));

      if (pendentesMovimentacao.length - 1 === 0) {
        setPopupAberto(false);
      }
    }).catch(err => {
      console.error('Erro ao atualizar etapa:', err);
      alert('Erro ao atualizar etapa');
    });
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
      await axios.patch(`${import.meta.env.VITE_API_URL}/oportunidades/${idMudandoStatus}/`, {
        etapa: 'perdida',
        motivo_venda_perdida: motivoPerda,  // ✅ Envia para o backend
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });



      setDados(prev =>
        prev.map(o =>
          o.id === idMudandoStatus
            ? { ...o, etapa: 'perdida', data_status: new Date().toISOString(), observacao: motivoPerda }
            : o
        )
      );

      setModalAberto(false);
      setIdMudandoStatus(null);
      setMotivoPerda('');
    } catch (err) {
      console.error('Erro ao atualizar etapa:', err);
      alert('Erro ao atualizar etapa');
    }
  };



  const dadosFiltrados = useMemo(() => {
    return dadosComDias.filter((o) => {
      const nomeMatch = nomeFiltro === '' || o.parceiro_nome.toLowerCase().includes(nomeFiltro.toLowerCase());
      const etapaMatch = !etapaFiltro || o.etapa === etapaFiltro;
      const dataCriacao = new Date(o.data_criacao);
      const dataMatch =
        (!dataInicio || dataCriacao >= new Date(dataInicio as Date)) &&
        (!dataFim || dataCriacao <= new Date(dataFim as Date));
      return nomeMatch && etapaMatch && dataMatch;
    });
  }, [dadosComDias, nomeFiltro, etapaFiltro, dataInicio, dataFim]);
  

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
  };

  const salvarEdicao = async (id: number) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/oportunidades/${id}/`, {
        valor: parseFloat(valorEdit.replace(',', '.')) || 0,
        observacao: observacaoEdit,
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
            label="Status"
            placeholder="Todos"
            value={etapaFiltro}
            onChange={setEtapaFiltro}
            data={etapaOptions}
            clearable
          />
          {[{ label: 'Data início', value: dataInicio, onChange: setDataInicio },
          { label: 'Data fim', value: dataFim, onChange: setDataFim }].map((item, idx) => (
            <Box key={idx} style={{ minWidth: 160 }}>
              <DatePickerInput
                value={item.value}
                onChange={item.onChange}
                locale="pt-br"
                label={item.label}
                dropdownType="popover"
                clearable
                rightSection={null}
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
                            <th className={styles.center}>Data Status</th>
                            <th className={styles.center}>Gatilho</th>
                            <th className={styles.left}>Observação</th>
                            <th className={styles.center}>Sem Movimentação</th>
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
                                  {o.data_status
                                    ? new Date(o.data_status).toLocaleDateString('pt-BR')
                                    : '-'}
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
                                  {o.dias_sem_movimentacao !== null
                                    ? `${o.dias_sem_movimentacao} dias`
                                    : '-'}
                                </td>
                                <td className={styles.center}>
                                  <Group gap="xs" justify="center">
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

                                    {emEdicao ? (
                                      <>
                                        <Button
                                          size="xs"
                                          color="green"
                                          onClick={() => salvarEdicao(o.id)}
                                        >
                                          <Save size={16} />
                                        </Button>
                                        <Button
                                          size="xs"
                                          variant="outline"
                                          color="red"
                                          onClick={cancelarEdicao}
                                        >
                                          <X size={16} />
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={() => iniciarEdicao(o)}
                                      >
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

      <Modal
  opened={popupAberto}
  onClose={() => {}}
  withCloseButton={false}
  title="⚠️ Oportunidades sem movimentação"
  centered
  radius="md"
  withinPortal={false}  // 👈 ISSO RESOLVE TUDO
  overlayProps={{
    backgroundOpacity: 0.55,
    blur: 4,
  }}
>

        {pendentesMovimentacao.map((o) => (
          <Card key={o.id} withBorder mb="sm">
            <Group justify="space-between">
              <div>
                <strong>{o.parceiro_nome}</strong> <br />
                {o.dias_sem_movimentacao} dias sem movimentação
              </div>
              <Select
                placeholder="Mudar etapa"
                data={etapaOptions}
                value={o.etapa}
                onChange={(value) => value && handleStatusChangePopup(o.id, value)}
              />
            </Group>
          </Card>
        ))}

        {pendentesMovimentacao.length === 0 && (
          <Button fullWidth onClick={() => setPopupAberto(false)}>
            Fechar
          </Button>
        )}
      </Modal>


      {modalAberto && idMudandoStatus !== null && (
        <Modal
          opened={modalAberto}
          onClose={() => setModalAberto(false)}
          title="Marcar como Venda Perdida"
          centered
          radius="md"
          withinPortal={false}  // <-- ADICIONE ISSO
          overlayProps={{
            backgroundOpacity: 0.55,
            blur: 4,
          }}
        >


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

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="red" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button color="green" onClick={confirmarVendaPerdida}>
              Confirmar
            </Button>
          </Group>
        </Modal>



      )}

    </SidebarGestor>
  );
}