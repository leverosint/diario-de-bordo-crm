import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Title, Table, Container, Loader, ScrollArea, Badge, Group, Text, Divider, Card, Box, Select
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

export default function OportunidadesPage() {
  const [dados, setDados] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const token = localStorage.getItem('token');
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
      orcamento: 'yellow',
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

      setDados(prev =>
        prev.map(o => o.id === id
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
    <SidebarGestor tipoUser={usuario.tipo_user}>
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
                      {lista.length} oportunidades
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
                                  color: 'white',
                                  fontWeight: 500,
                                  textAlign: 'center',
                                }
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
