import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Title,
  Table,
  Container,
  Loader,
  ScrollArea,
  Group,
  Select,
  TextInput,
  Card,
  Text,
  Button,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import type { DateValue } from '@mantine/dates';
import SidebarGestor from '../components/SidebarGestor';
import dayjs from 'dayjs';

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
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState<string | null>('Todas');
  const [intervaloDatas, setIntervaloDatas] = useState<[DateValue, DateValue]>([null, null]);

  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const tipoUser = usuario?.tipo_user ?? '';

  const etapaOptions = [
    { value: 'oportunidade', label: 'Oportunidade' },
    { value: 'orcamento', label: 'Orçamento' },
    { value: 'aguardando', label: 'Pedido Aguardando Aprovação' },
    { value: 'pedido', label: 'Pedido Realizado' },
    { value: 'perdida', label: 'Venda Perdida' },
  ];

  const getStatusColor = (etapa: string) => {
    const cores: Record<string, string> = {
      oportunidade: '#007bff',
      orcamento: '#ffeb3b',
      aguardando: '#ff9800',
      pedido: '#4caf50',
      perdida: '#f44336',
    };
    return cores[etapa] || '#ccc';
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
    return dados.filter((item) => {
      const dentroData =
        !intervaloDatas[0] ||
        !intervaloDatas[1] ||
        (dayjs(item.data_criacao).isAfter(dayjs(intervaloDatas[0])) &&
          dayjs(item.data_criacao).isBefore(dayjs(intervaloDatas[1]).add(1, 'day')));

      const dentroEtapa = filtroEtapa === 'Todas' || item.etapa === filtroEtapa;
      const nomeInclui = item.parceiro_nome.toLowerCase().includes(filtroNome.toLowerCase());

      return dentroData && dentroEtapa && nomeInclui;
    });
  }, [dados, filtroNome, filtroEtapa, intervaloDatas]);

  const agrupado = useMemo(() => {
    const agrupado: Record<string, Oportunidade[]> = {};
    dadosFiltrados.forEach(item => {
      const status = item.etapa || 'Sem status';
      if (!agrupado[status]) agrupado[status] = [];
      agrupado[status].push(item);
    });
    return agrupado;
  }, [dadosFiltrados]);

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Container fluid>
        <Group justify="space-between" mb="md">
          <Title order={2}>Oportunidades por Status</Title>
          <Button variant="light" color="blue">Exportar Excel</Button>
        </Group>

        <Group mb="md" grow>
          <TextInput
            placeholder="Filtrar por nome do parceiro"
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.currentTarget.value)}
          />
          <Select
            placeholder="Todas"
            value={filtroEtapa}
            onChange={(value) => setFiltroEtapa(value)}
            data={['Todas', ...etapaOptions.map(opt => opt.value)]}
          />
          <DatePickerInput
            type="range"
            placeholder="Intervalo de datas"
            value={intervaloDatas}
            onChange={setIntervaloDatas}
          />
        </Group>

        {carregando ? (
          <Loader />
        ) : (
          <ScrollArea>
            {Object.entries(agrupado).map(([status, lista]) => (
              <Card
                key={status}
                withBorder
                shadow="sm"
                radius="md"
                mb="xl"
                style={{
                  borderLeft: `8px solid ${getStatusColor(status)}`,
                  backgroundColor: '#f9f9f9'
                }}
              >
                <Group justify="space-between" mb="xs">
                  <Title order={4} style={{ textTransform: 'capitalize' }}>{status}</Title>
                  <Text size="sm" color="gray">
                    {lista.length} oportunidade{lista.length > 1 ? 's' : ''}
                  </Text>
                </Group>

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
                        <td>{o.parceiro_nome}</td>
                        <td>R$ {o.valor.toLocaleString('pt-BR')}</td>
                        <td>{new Date(o.data_criacao).toLocaleDateString()}</td>
                        <td>{o.data_status ? new Date(o.data_status).toLocaleDateString() : '-'}</td>
                        <td>
                          <Select
                            value={o.etapa}
                            onChange={(value) => handleStatusChange(o.id, value)}
                            data={etapaOptions}
                            styles={{
                              input: {
                                backgroundColor: getStatusColor(o.etapa),
                                color: o.etapa === 'orcamento' ? '#000' : '#fff',
                                fontWeight: 600,
                                textAlign: 'center',
                                borderRadius: '6px'
                              }
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            ))}
          </ScrollArea>
        )}
      </Container>
    </SidebarGestor>
  );
}
