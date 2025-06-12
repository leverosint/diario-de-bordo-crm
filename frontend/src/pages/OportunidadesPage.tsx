import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Title, Table, Container, Loader, ScrollArea, Badge, Group, Text, Divider, Card, Box
} from '@mantine/core';
import SidebarGestor from '../components/SidebarGestor';

interface Oportunidade {
  id: number;
  parceiro: string;
  status: string;
  valor: number;
  data_criacao: string;
  ultima_interacao?: string;
}

export default function OportunidadesPage() {
  const [dados, setDados] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

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

  const getStatusColor = (status: string) => {
    const mapa: Record<string, string> = {
      'Oportunidade': 'blue',
      'Orçamento': 'yellow',
      'Pedido Aguardando Aprovação': 'orange',
      'Pedido Realizado': 'green',
      'Venda Perdida': 'red',
    };
    return mapa[status] || 'gray';
  };

  const agrupadoPorStatus = useMemo((): Record<string, Oportunidade[]> => {
    const agrupado: Record<string, Oportunidade[]> = {};
    (dados || []).forEach((item: Oportunidade) => {
      const status = item.status || 'Sem status';
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
                    <Title order={4}>{status}</Title>
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
                        <th>Última Interação</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((o) => (
                        <tr key={o.id}>
                          <td><Text fw={500}>{o.parceiro}</Text></td>
                          <td>R$ {o.valor.toLocaleString('pt-BR')}</td>
                          <td>{new Date(o.data_criacao).toLocaleDateString()}</td>
                          <td>{o.ultima_interacao || '-'}</td>
                          <td>
                            <Badge color={getStatusColor(o.status)} variant="filled">
                              {o.status}
                            </Badge>
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
