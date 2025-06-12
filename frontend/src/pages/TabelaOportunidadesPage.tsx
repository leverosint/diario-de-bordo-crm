// IMPORTAÇÕES =============================================================
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Title, Table, Container, Loader, ScrollArea, Badge, Group, Text,
  Divider, Card, Box, Select, TextInput, Button, Tooltip, Indicator
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import type { DatesRangeValue } from '@mantine/dates';
import * as XLSX from 'xlsx';
import SidebarGestor from '../components/SidebarGestor';

// TIPAGEM =============================================================
interface Oportunidade {
  id: number;
  parceiro: number;
  parceiro_nome: string;
  valor: number;
  etapa: string;
  data_criacao: string;
  data_status?: string;
}

// COMPONENTE ==========================================================
export default function OportunidadesPage() {
  const [dados, setDados] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroParceiro, setFiltroParceiro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null);
  const [intervaloDatas, setIntervaloDatas] = useState<[Date | null, Date | null]>([null, null]);
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const etapaOptions = [
    'Oportunidade',
    'Orçamento',
    'Pedido Aguardando Aprovação',
    'Pedido Realizado',
    'Venda Perdida'
  ];

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

  useEffect(() => {
    fetchDados();
  }, []);

  const handleStatusChange = async (id: number, value: string | null) => {
    if (!value) return;
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/oportunidades/${id}/`, {
        etapa: value
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDados();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const getStatusColor = (etapa: string) => {
    const cores: Record<string, string> = {
      'Oportunidade': '#228be6',
      'Orçamento': '#fab005',
      'Pedido Aguardando Aprovação': '#ffa94d',
      'Pedido Realizado': '#40c057',
      'Venda Perdida': '#fa5252',
    };
    return cores[etapa] || '#ced4da';
  };

  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleDateString('pt-BR') : '-';

  const calcularTempoMedio = (lista: Oportunidade[]) => {
    const dias = lista
      .filter(o => o.data_status)
      .map(o => (new Date(o.data_status!).getTime() - new Date(o.data_criacao).getTime()) / (1000 * 60 * 60 * 24));
    if (dias.length === 0) return '-';
    const media = dias.reduce((a, b) => a + b, 0) / dias.length;
    return `${Math.round(media)} dia${media > 1 ? 's' : ''}`;
  };

  const oportunidadesFiltradas = useMemo(() => {
    return dados.filter((o) => {
      const nomeInclui = o.parceiro_nome?.toLowerCase().includes(filtroParceiro.toLowerCase());
      const dataCriacao = new Date(o.data_criacao);
      const [inicio, fim] = intervaloDatas;
      const dentroIntervalo = (!inicio || dataCriacao >= inicio) && (!fim || dataCriacao <= fim);
      const statusCondiz = !filtroStatus || o.etapa === filtroStatus;
      return nomeInclui && dentroIntervalo && statusCondiz;
    });
  }, [dados, filtroParceiro, intervaloDatas, filtroStatus]);

  const agrupadoPorEtapa = useMemo(() => {
    const map: Record<string, Oportunidade[]> = {};
    oportunidadesFiltradas.forEach(o => {
      const key = o.etapa || 'Sem etapa';
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return map;
  }, [oportunidadesFiltradas]);

  const exportarParaExcel = () => {
    const planilha = oportunidadesFiltradas.map(o => ({
      Parceiro: o.parceiro_nome,
      Valor: o.valor,
      Etapa: o.etapa,
      'Data Criação': formatDate(o.data_criacao),
      'Data Status': formatDate(o.data_status),
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(planilha);
    XLSX.utils.book_append_sheet(wb, ws, 'Oportunidades');
    XLSX.writeFile(wb, 'oportunidades.xlsx');
  };

  // RENDER ============================================================
  return (
    <SidebarGestor tipoUser={usuario.tipo_user}>
      <Container size="xl" p="md">
        <Group justify="space-between" mb="md">
          <Title order={2}>Oportunidades por Status</Title>
          <Button onClick={exportarParaExcel} variant="light">Exportar Excel</Button>
        </Group>

        <Group mb="md" grow>
          <TextInput
            placeholder="Filtrar por nome do parceiro"
            value={filtroParceiro}
            onChange={(e) => setFiltroParceiro(e.currentTarget.value)}
          />
          <Select
            data={['Todas', ...etapaOptions]}
            placeholder="Filtrar por etapa"
            value={filtroStatus || 'Todas'}
            onChange={(value) => setFiltroStatus(value === 'Todas' ? null : value)}
            clearable
          />
          <DatePickerInput
            type="range"
            placeholder="Intervalo de datas"
            value={intervaloDatas}
            onChange={setIntervaloDatas}
            locale="pt-BR"
            clearable
          />
        </Group>

        {carregando ? <Loader /> : (
          <ScrollArea>
            {Object.entries(agrupadoPorEtapa).map(([etapa, lista]) => {
              const totalValor = lista.reduce((acc, cur) => acc + cur.valor, 0);
              const tempoMedio = calcularTempoMedio(lista);
              return (
                <Box key={etapa} mt="xl">
                  <Card withBorder shadow="md" radius="lg" p="lg" mb="lg">
                    <Group justify="space-between" mb="sm">
                      <Group>
                        <Title order={4} style={{ textTransform: 'capitalize' }}>{etapa.toLowerCase()}</Title>
                        <Tooltip label={`Tempo médio na etapa: ${tempoMedio}`} withArrow>
                          <Indicator color="gray" size={12} processing>
                            <Text size="xs" c="dimmed">{tempoMedio}</Text>
                          </Indicator>
                        </Tooltip>
                      </Group>
                      <Badge color={getStatusColor(etapa)} variant="light" radius="xl">
                        {lista.length} oportunidades | Total: R$ {totalValor.toLocaleString('pt-BR')}
                      </Badge>
                    </Group>
                    <Divider my="sm" />
                    <Table striped highlightOnHover withTableBorder>
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
                        {lista.map((o) => (
                          <tr key={o.id}>
                            <td><Text fw={500}>{o.parceiro_nome}</Text></td>
                            <td>R$ {(o?.valor ?? 0).toLocaleString('pt-BR')}</td>
                            <td>{formatDate(o.data_criacao)}</td>
                            <td>{formatDate(o.data_status)}</td>
                            <td>
                              <Select
                                value={o.etapa}
                                onChange={(value) => handleStatusChange(o.id, value)}
                                data={etapaOptions.map(v => ({ value: v, label: v }))}
                                styles={{
                                  input: {
                                    backgroundColor: getStatusColor(o.etapa),
                                    color: 'white',
                                    fontWeight: 600,
                                    borderRadius: 8,
                                    textAlign: 'center',
                                  },
                                }}
                                size="xs"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
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