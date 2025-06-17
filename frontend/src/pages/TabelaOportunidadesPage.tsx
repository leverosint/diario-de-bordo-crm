import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Title, Table, Container, Loader, ScrollArea, Badge, Group,
  TextInput, Button, Tooltip, Card, Box, Select
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import 'dayjs/locale/pt-br';
import * as XLSX from 'xlsx';
import SidebarGestor from '../components/SidebarGestor';
import type { DateValue } from '@mantine/dates';

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


  const token = localStorage.getItem('token') ?? '';
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const tipoUser = (usuario as { tipo_user?: string })?.tipo_user ?? '';

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

  const handleStatusChange = async (id: number, novaEtapa: string | null) => {
    if (!novaEtapa) return;
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/oportunidades/${id}/`, {
        etapa: novaEtapa,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDados(prev =>
        prev.map(o =>
          o.id === id ? { ...o, etapa: novaEtapa, data_status: new Date().toISOString() } : o
        )
      );
    } catch (err) {
      console.error('Erro ao atualizar etapa:', err);
    }
  };

  const dadosFiltrados = useMemo(() => {
    return dados.filter((o) => {
      const nomeMatch = nomeFiltro === '' || o.parceiro_nome.toLowerCase().includes(nomeFiltro.toLowerCase());
      const etapaMatch = !etapaFiltro || o.etapa === etapaFiltro;
      const dataCriacao = new Date(o.data_criacao);
      const dataMatch =
        (!dataInicio || dataCriacao >= new Date(dataInicio as Date)) &&
        (!dataFim || dataCriacao <= new Date(dataFim as Date));
      return nomeMatch && etapaMatch && dataMatch;
    });
  }, [dados, nomeFiltro, etapaFiltro, dataInicio, dataFim]);

  const agrupadoPorStatus = useMemo((): Record<string, Oportunidade[]> => {
    const agrupado: Record<string, Oportunidade[]> = {};
    dadosFiltrados.forEach((item) => {
      const status = item.etapa || 'Sem status';
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
          <Button onClick={exportarExcel} variant="light">Exportar Excel</Button>
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

        {carregando ? <Loader /> : (
          <ScrollArea>
            {Object.entries(agrupadoPorStatus).map(([status, lista]) => {
              const valorTotal = lista.reduce((acc, o) => acc + Number(o.valor), 0).toFixed(2);
              const tempoMedio = calcularTempoMedio(lista);

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
                        <Title order={3}>{status.toUpperCase()}</Title>
                        <p style={{ fontSize: '0.9rem', color: '#555' }}>
                          Valor total: R$ {valorTotal.replace('.', ',')}
                        </p>
                      </div>
                      <Group>
                        <Badge color={getStatusColor(status)} variant="light">
                          {lista.length} oportunidades
                        </Badge>
                        <Tooltip label="Tempo médio até status" withArrow>
                          <Badge color="gray" variant="outline">
                            ⏱ {tempoMedio} dias
                          </Badge>
                        </Tooltip>
                      </Group>
                    </Group>

                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      <Table striped highlightOnHover withColumnBorders>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Parceiro</th>
                            <th>Valor</th>
                            <th>Data Criação</th>
                            <th>Data Status</th>
                            <th>Gatilho</th>
                            <th>Observação</th>
                            <th>Sem Movimentação</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
  {lista.map((o) => {
    const emEdicao = editandoId === o.id;
    return (
      <tr
        key={o.id}
        style={{
          backgroundColor: (o.dias_sem_movimentacao ?? 0) >= 7 ? '#ffe5e5' : 'white',
          border: (o.dias_sem_movimentacao ?? 0) >= 7 ? '1px solid red' : '',
        }}
      >
        <td>{o.id}</td>
        <td>{o.parceiro_nome}</td>

        {/* VALOR */}
        <td>
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

        {/* DATAS */}
        <td>{new Date(o.data_criacao).toLocaleDateString('pt-BR')}</td>
        <td>{o.data_status ? new Date(o.data_status).toLocaleDateString('pt-BR') : '-'}</td>

        {/* GATILHO */}
        <td>{o.gatilho_extra || '-'}</td>

        {/* OBSERVAÇÃO */}
        <td>
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

        {/* SEM MOVIMENTAÇÃO */}
        <td>
          {o.dias_sem_movimentacao !== undefined ? `${o.dias_sem_movimentacao} dias` : '-'}
          {(o.dias_sem_movimentacao ?? 0) >= 7 ? ' ⚠️' : ''}
        </td>

        {/* STATUS E AÇÕES */}
        <td>
          <Group gap="xs">
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
                }
              }}
            />
            {emEdicao ? (
              <>
                <Button size="xs" color="green" onClick={() => salvarEdicao(o.id)}>
                  Salvar
                </Button>
                <Button size="xs" variant="outline" color="red" onClick={cancelarEdicao}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                size="xs"
                variant="outline"
                onClick={() => iniciarEdicao(o)}
              >
                ✏️
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
    </SidebarGestor>
  );
}
