import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Title,
  Table,
  Container,
  Loader,
  ScrollArea,
  Badge,
  Group,
  Card,
  Box,
  Select,
  TextInput,
  Button,
  Tooltip,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
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
  data_status: string;
}

export default function TabelaOportunidadesPage() {
  const [dados, setDados] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nomeFiltro, setNomeFiltro] = useState('');
  const [etapaFiltro, setEtapaFiltro] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState<DateValue>(null);
  const [dataFim, setDataFim] = useState<DateValue>(null);
  const token = localStorage.getItem('token') ?? '';
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const etapaOptions = [
    { value: 'oportunidade', label: 'Oportunidade' },
    { value: 'orcamento', label: 'Orçamento' },
    { value: 'aguardando', label: 'Pedido Aguardando Aprovação' },
    { value: 'pedido', label: 'Pedido Realizado' },
    { value: 'perdida', label: 'Venda Perdida' },
  ];

  const getStatusColor = (etapa: string) => {
    const mapa: Record<string, string> = {
      oportunidade: 'blue',
      orcamento: 'teal',
      aguardando: 'orange',
      pedido: 'green',
      perdida: 'red',
    };
    return mapa[etapa] || 'gray';
  };

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/oportunidades/`, {
          headers: { Authorization: `Bearer ${token}` }
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
        headers: { Authorization: `Bearer ${token}` }
      });

      setDados(prev => prev.map(o =>
        o.id === id ? { ...o, etapa: novaEtapa, data_status: new Date().toISOString() } : o
      ));
    } catch (err) {
      console.error('Erro ao atualizar etapa:', err);
    }
  };

  const dadosFiltrados = useMemo(() => {
    return dados.filter((o) => {
      const nomeMatch = nomeFiltro === '' || o.parceiro_nome.toLowerCase().includes(nomeFiltro.toLowerCase());
      const etapaMatch = !etapaFiltro || o.etapa === etapaFiltro;
      const dataCriacao = new Date(o.data_criacao);
      const dataMatch = (!dataInicio || dataCriacao >= new Date(dataInicio)) &&
                        (!dataFim || dataCriacao <= new Date(dataFim));
      return nomeMatch && etapaMatch && dataMatch;
    });
  }, [dados, nomeFiltro, etapaFiltro, dataInicio, dataFim]);

  const agrupadoPorStatus = useMemo((): Record<string, Oportunidade[]> => {
    const agrupado: Record<string, Oportunidade[]> = {};
    dadosFiltrados.forEach((item) => {
      const status = item.etapa || 'Sem status';
      if (!agrupado[status]) agrupado[status] = [];
      agrupado[status].push(item);
    });
    return agrupado;
  }, [dadosFiltrados]);

  const exportarExcel = () => {
    const linhas = dadosFiltrados.map(o => ({
      Parceiro: o.parceiro_nome,
      Valor: o.valor,
      Etapa: o.etapa,
      'Data Criação': new Date(o.data_criacao).toLocaleDateString('pt-BR'),
      'Data Status': o.data_status ? new Date(o.data_status).toLocaleDateString('pt-BR') : '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(linhas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Oportunidades");
    XLSX.writeFile(workbook, "oportunidades.xlsx");
  };

  const calcularTempoMedio = (lista: Oportunidade[]) => {
    const dias = lista
      .filter(o => o.data_status)
      .map(o => (new Date(o.data_status).getTime() - new Date(o.data_criacao).getTime()) / (1000 * 60 * 60 * 24));
    if (dias.length === 0) return 0;
    return Math.round(dias.reduce((a, b) => a + b, 0) / dias.length);
  };

  return (
    <SidebarGestor tipoUser={usuario?.tipo_user || ''}>
      <Container fluid style={{ maxWidth: '100%', padding: '0 40px' }}>
        <Group justify="space-between" align="center" mt="md" mb="sm">
          <Title order={2}>Oportunidades por Status</Title>
          <Button onClick={exportarExcel} variant="light">Exportar Excel</Button>
        </Group>

        <Group mt="xs" mb="md" grow align="end">
          <TextInput
            placeholder="Filtrar por nome do parceiro"
            value={nomeFiltro}
            onChange={(e) => setNomeFiltro(e.currentTarget.value)}
            label="Nome do parceiro"
          />
          <Select
            label="Status"
            placeholder="Todos"
            value={etapaFiltro}
            onChange={setEtapaFiltro}
            data={etapaOptions}
            clearable
            searchable={false}
            allowDeselect
          />
          <Box style={{ display: 'flex', gap: 8 }}>
            <DatePicker
              placeholder="Início"
              value={dataInicio}
              onChange={setDataInicio}
              locale="pt-br"
              clearable
              dropdownType="modal"
              style={{ minWidth: 120 }}
            />
            <DatePicker
              placeholder="Fim"
              value={dataFim}
              onChange={setDataFim}
              locale="pt-br"
              clearable
              dropdownType="modal"
              style={{ minWidth: 120 }}
            />
          </Box>
        </Group>

        {carregando ? <Loader /> : (
          <ScrollArea>
            {Object.entries(agrupadoPorStatus).map(([status, lista]) => {
              const valorTotal = lista.reduce((acc, o) => acc + Number(o.valor), 0).toFixed(2);
              const tempoMedio = calcularTempoMedio(lista);
              const listaLimitada = lista.slice(0, 5);

              return (
                <Box key={status} mt="xl">
                  <Card
                    withBorder
                    shadow="sm"
                    radius="lg"
                    p="xl"
                    mb="lg"
                    style={{ borderLeft: `8px solid ${getStatusColor(status)}`, backgroundColor: '#f9f9f9' }}
                  >
                    <Group justify="space-between" align="center" mb="sm">
                      <div>
                        <Title order={3} style={{ marginBottom: 4 }}>{status.toUpperCase()}</Title>
                        <p style={{ fontSize: '0.9rem', color: '#555' }}>
                          Valor total: R$ {valorTotal.replace('.', ',')}
                        </p>
                      </div>
                      <Group>
                        <Badge color={getStatusColor(status)} variant="light">
                          {lista.length} oportunidades
                        </Badge>
                        <Tooltip label="Tempo médio entre criação e status nesta categoria" withArrow>
                          <Badge color="gray" variant="outline" style={{ cursor: 'help' }}>
                            ⏱ {tempoMedio} dias
                          </Badge>
                        </Tooltip>
                      </Group>
                    </Group>

                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      <Table striped highlightOnHover withColumnBorders>
                        <thead>
                          <tr>
                            <th>Parceiro</th>
                            <th>Valor</th>
                            <th>Data Criação</th>
                            <th>Data Status</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listaLimitada.map((o) => (
                            <tr key={o.id}>
                              <td>{o.parceiro_nome}</td>
                              <td>R$ {Number(o.valor).toFixed(2).replace('.', ',')}</td>
                              <td>{new Date(o.data_criacao).toLocaleDateString('pt-BR')}</td>
                              <td>{o.data_status ? new Date(o.data_status).toLocaleDateString('pt-BR') : '-'}</td>
                              <td>
                                <Select
                                  value={o.etapa}
                                  onChange={(value) => value && handleStatusChange(o.id, value)}
                                  data={etapaOptions}
                                  size="xs"
                                  searchable={false}
                                  allowDeselect={false}
                                  styles={{
                                    input: {
                                      backgroundColor: getStatusColor(o.etapa),
                                      color: 'white',
                                      fontWeight: 600,
                                      textAlign: 'center',
                                      borderRadius: 6,
                                      minWidth: 180,
                                    }
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
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
