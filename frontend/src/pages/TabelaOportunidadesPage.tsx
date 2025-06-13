import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Title, Table, Container, Loader, ScrollArea, Badge, Group, Text,
  Divider, Card, Box, Select, TextInput, Button, Tooltip, Indicator
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import * as XLSX from 'xlsx';
import SidebarGestor from '../components/SidebarGestor';

import {
  ShoppingCart,
  XCircle,
  Target,
  Briefcase,
  Clock
} from 'lucide-react';

function hexToRGBA(hex: string, alpha: number) {
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface Oportunidade {
  id: number;
  parceiro: number;
  parceiro_nome: string;
  valor: number;
  etapa: string;
  data_criacao: string;
  data_status?: string;
}

export default function TabelaOportunidadesPage() {
  const [dados, setDados] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroParceiro, setFiltroParceiro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null);
  const [intervaloDatas, setIntervaloDatas] = useState<[string | null, string | null]>([null, null]);

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

      // Atualização local para refletir imediatamente
      setDados(prev =>
        prev.map(o =>
          o.id === id ? { ...o, etapa: value } : o
        )
      );

      // Opcional: fetchDados() novamente para garantir consistência
      // await fetchDados();

    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const getStatusColor = (etapa: string) => {
    const cores: Record<string, string> = {
      'oportunidade': '#228be6',
      'orçamento': '#fab005',
      'pedido aguardando aprovação': '#ffa94d',
      'pedido realizado': '#40c057',
      'venda perdida': '#fa5252',
    };
    return cores[etapa?.toLowerCase().trim()] || '#ced4da';
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
      const dentroIntervalo =
        (!inicio || dataCriacao >= new Date(inicio)) &&
        (!fim || dataCriacao <= new Date(fim));
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
              const totalValor = lista.reduce((acc, cur) => acc + (cur.valor ?? 0), 0);
              const tempoMedio = calcularTempoMedio(lista);
              const cor = getStatusColor(etapa);
              return (
                <Box key={etapa} mt="xl">
                  <Card
                    withBorder
                    radius="xl"
                    p="xl"
                    mb="xl"
                    style={{
                      borderLeft: `6px solid ${cor}`,
                      backgroundColor: hexToRGBA(cor, 0.1),
                      boxShadow: '0 8px 18px rgba(0,0,0,0.06)',
                    }}
                  >
                    <Group justify="space-between" mb="sm">
                      <Group align="center">
                        {etapa === 'Pedido Realizado' && <ShoppingCart size={18} color="#40c057" />}
                        {etapa === 'Venda Perdida' && <XCircle size={18} color="#fa5252" />}
                        {etapa === 'Oportunidade' && <Target size={18} color="#228be6" />}
                        {etapa === 'Orçamento' && <Briefcase size={18} color="#fab005" />}
                        {etapa === 'Pedido Aguardando Aprovação' && <Clock size={18} color="#ffa94d" />}
                        <Title order={4} tt="capitalize" ml={8}>{etapa.toLowerCase()}</Title>
                        <Tooltip label={`Tempo médio na etapa: ${tempoMedio}`} withArrow>
                          <Indicator color="gray" size={12} processing>
                            <Text size="xs" c="dimmed">{tempoMedio}</Text>
                          </Indicator>
                        </Tooltip>
                      </Group>
                      <Badge color={cor} variant="light" radius="xl">
                        {lista.length} oportunidades | Total: R$ {totalValor.toLocaleString('pt-BR')}
                      </Badge>
                    </Group>
                    <Divider my="sm" />
                    <Table
                      striped
                      highlightOnHover
                      withTableBorder
                      verticalSpacing="md"
                      horizontalSpacing="lg"
                      style={{ width: '100%', minWidth: '850px', fontSize: '0.95rem' }}
                    >
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
                            <td>R$ {Number(o?.valor ?? 0).toLocaleString('pt-BR')}</td>
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
