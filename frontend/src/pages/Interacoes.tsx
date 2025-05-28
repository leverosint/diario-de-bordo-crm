// src/pages/Interacoes.tsx
import { useEffect, useState } from 'react';
import {
  Container, Title, Group, Badge, Button, Table, Loader, Modal,
} from '@mantine/core';
import axios from 'axios';

interface Parceiro {
  id: number;
  parceiro: string;
  canal_venda: string;
  classificacao: string;
  status: string;
}

export default function Interacoes() {
  const [pendentes, setPendentes] = useState<Parceiro[]>([]);
  const [interagidos, setInteragidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [historico, setHistorico] = useState<any[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [parceiroSelecionado, setParceiroSelecionado] = useState<string | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [pend, inter] = await Promise.all([
          axios.get('/api/interacoes/pendentes/', { headers }),
          axios.get('/api/interacoes/hoje/', { headers }),
        ]);
        setPendentes(pend.data);
        setInteragidos(inter.data);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const abrirHistorico = async (parceiroId: number) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const resp = await axios.get(`/api/interacoes/historico/?parceiro_id=${parceiroId}`, { headers });
      setHistorico(resp.data);
      const nome = pendentes.find(p => p.id === parceiroId)?.parceiro || 'Parceiro';
      setParceiroSelecionado(nome);
      setModalAberto(true);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  };

  const renderStatus = (status: string) => {
    const cor =
      status === 'Recorrente' ? 'green' :
      status.includes('30') ? 'yellow' :
      status.includes('60') ? 'orange' :
      'red';
    return <Badge color={cor}>{status}</Badge>;
  };

  if (loading) return <Loader mt="xl" />;

  return (
    <Container>
      <Title order={2} mb="md">Interações</Title>

      <Group justify="space-between" mb="sm">
        <Title order={4}>Parceiros a interagir ({pendentes.length})</Title>
        <Button variant="outline">Exportar Excel</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder withColumnBorders mb="xl">
        <thead>
          <tr>
            <th>Parceiro</th>
            <th>Canal</th>
            <th>Classificação</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pendentes.map(p => (
            <tr key={p.id}>
              <td>{p.parceiro}</td>
              <td>{p.canal_venda}</td>
              <td>{p.classificacao}</td>
              <td>{renderStatus(p.status)}</td>
              <td>
                <Button size="xs" variant="light" onClick={() => abrirHistorico(p.id)}>Ver histórico</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Title order={4} mb="sm">Interagidos hoje ({interagidos.length})</Title>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <thead>
          <tr>
            <th>Parceiro</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {interagidos.map((i) => (
            <tr key={i.id}>
              <td>{i.parceiro?.parceiro || 'Sem nome'}</td>
              <td>{new Date(i.data_interacao).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal
        opened={modalAberto}
        onClose={() => setModalAberto(false)}
        title={`Histórico - ${parceiroSelecionado}`}
        size="lg"
      >
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Usuário</th>
            </tr>
          </thead>
          <tbody>
            {historico.map((item, index) => (
              <tr key={index}>
                <td>{new Date(item.data_interacao).toLocaleString()}</td>
                <td>{item.tipo}</td>
                <td>{item.usuario?.username || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal>
    </Container>
  );
}
