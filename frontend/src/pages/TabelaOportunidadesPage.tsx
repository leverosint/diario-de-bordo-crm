import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Title, Table, Container, Loader, ScrollArea,
  Badge, Group, Card, Box, Select
} from '@mantine/core';
import SidebarGestor from '../components/SidebarGestor';

interface Oportunidade {
  id: number;
  parceiro: number;
  parceiro_nome: string;
  valor: number;
  etapa: string;
  data_criacao: string;
  data_status: string;
}

const etapaOptions = [
  { value: 'oportunidade', label: 'Oportunidade' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'aguardando', label: 'Pedido Aguardando Aprovação' },
  { value: 'pedido', label: 'Pedido Realizado' },
  { value: 'perdida', label: 'Venda Perdida' },
];

const getStatusColor = (etapa: string) => {
  const cores: Record<string, string> = {
    oportunidade: 'blue',
    orcamento: 'yellow',
    aguardando: 'orange',
    pedido: 'green',
    perdida: 'red',
  };
  return cores[etapa] || 'gray';
};

export default function TabelaOportunidadesPage() {
  const [dados, setDados] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const tipoUser: string = usuario?.tipo_user ?? 'VENDEDOR';

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
          o.id === id
            ? { ...o, etapa: novaEtapa, data_status: new Date().toISOString() }
            : o
        )
      );
    } catch (err) {
      console.error('Erro ao atualizar etapa:', err);
    }
  };

  const agrupadoPorStatus = useMemo((): Record<string, Oportunidade[]> => {
    const agrupado: Record<string, Oportunidade[]> = {};
    dados.forEach((item) => {
      const status = item.etapa || 'Sem status';
      if (!agrupado[status]) agrupado[status] = [];
      agrupado[status].push(item);
    });
    return agrupado;
  }, [dados]);

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Container fluid>
        <Title order={2} mb="md">Oportunidades por Status</Title>
        {carregando ? <Loader /> : (
          <ScrollArea>
            {Object.entries(agrupadoPorStatus).map(([status, lista]) => (
              <Box key={status} mt="xl">
                <Card withBorder shadow="sm" radius="md" p="md" mb="md">
                  <Group justify="space-between">
                    <Title order={4} style={{ textTransform: 'capitalize' }}>{status}</Title>
                    <Badge color={getStatusColor(status)} variant="light">
                      {lista.length} oportunidade{lista.length > 1 ? 's' : ''}
                    </Badge>
                  </Group>

                  <Table striped highlightOnHover withTableBorder mt="md">
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
                          <td>R$ {Number(o.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td>{new Date(o.data_criacao).toLocaleDateString('pt-BR')}</td>
                          <td>{o.data_status ? new Date(o.data_status).toLocaleDateString('pt-BR') : '-'}</td>
                          <td>
                            <Select
                              value={o.etapa}
                              onChange={(value) => handleStatusChange(o.id, value)}
                              data={etapaOptions}
                              styles={{
                                input: {
                                  backgroundColor: getStatusColor(o.etapa),
                                  color: 'white',
                                  fontWeight: 600,
                                  textAlign: 'center',
                                },
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              </Box>
            ))}
          </ScrollArea>
        )}
      </Container>
    </SidebarGestor>
  );
}
