import { useEffect, useState } from 'react';
import {
  Title, Group, Badge, Button, Table, Loader, Modal, Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import axios from 'axios';
import SidebarGestor from '../components/SidebarGestor';
import { useNavigate } from 'react-router-dom';

interface Interagido {
  id: number;
  parceiro_nome: string;
  data_interacao: string;
}

interface Parceiro {
  id: number;
  parceiro: string;
  canal_venda: string;
  classificacao: string;
  status: string;
}

export default function Interacoes() {
  const [pendentes, setPendentes] = useState<Parceiro[]>([]);
  const [interagidos, setInteragidos] = useState<Interagido[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [parceiroSelecionado, setParceiroSelecionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const tipoUser = JSON.parse(localStorage.getItem('usuario') || '{}')?.tipo_user || 'VENDEDOR';

  useEffect(() => {
    if (!token) {
      localStorage.clear();
      navigate('/');
      return;
    }

    async function fetchData() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [pend, inter] = await Promise.all([
          axios.get('/api/interacoes/pendentes/', { headers }),
          axios.get('/api/interacoes/hoje/', { headers }),
        ]);
        setPendentes(pend.data || []);
        setInteragidos(inter.data || []);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setErro('Erro ao buscar dados das interações.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token, navigate]);

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
      setErro('Erro ao carregar histórico de interações.');
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

  if (loading) {
    return (
      <SidebarGestor tipoUser={tipoUser}>
        <Loader mt="xl" />
      </SidebarGestor>
    );
  }

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <div style={{ width: '100%', padding: '1rem' }}>
        <Title order={2} mb="md">Interações</Title>

        {erro && (
          <Alert icon={<IconAlertCircle size={16} />} title="Erro" color="red" mb="md">
            {erro}
          </Alert>
        )}

        <Group justify="space-between" mb="sm">
          <Title order={4}>Parceiros a interagir ({pendentes.length})</Title>
          <Button variant="outline">Exportar Excel</Button>
        </Group>

        {/* TABELA COM OVERFLOW */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <Table striped highlightOnHover withTableBorder style={{ minWidth: '900px', width: '100%' }}>
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
              {pendentes.length === 0 ? (
                <tr><td colSpan={5}>Nenhum parceiro pendente.</td></tr>
              ) : (
                pendentes.map(p => (
                  <tr key={p.id}>
                    <td>{p.parceiro}</td>
                    <td>{p.canal_venda}</td>
                    <td>{p.classificacao}</td>
                    <td>{renderStatus(p.status)}</td>
                    <td>
                      <Button size="xs" variant="light" onClick={() => abrirHistorico(p.id)}>
                        Ver histórico
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        <Title order={4} mt="xl" mb="sm">Interagidos hoje ({interagidos.length})</Title>

        {/* SEGUNDA TABELA COM OVERFLOW */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <Table striped highlightOnHover withTableBorder style={{ minWidth: '600px', width: '100%' }}>
            <thead>
              <tr>
                <th>Parceiro</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {interagidos.length === 0 ? (
                <tr><td colSpan={2}>Nenhuma interação registrada hoje.</td></tr>
              ) : (
                interagidos.map((i) => (
                  <tr key={i.id}>
                    <td>{i.parceiro_nome || 'Sem nome'}</td>
                    <td>{new Date(i.data_interacao).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        <Modal
          opened={modalAberto}
          onClose={() => setModalAberto(false)}
          title={`Histórico - ${parceiroSelecionado}`}
          size="lg"
          lockScroll={false}
        >
          <Table striped highlightOnHover withTableBorder style={{ minWidth: '600px', width: '100%' }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {historico.length === 0 ? (
                <tr><td colSpan={3}>Nenhuma interação registrada.</td></tr>
              ) : (
                historico.map((item, index) => (
                  <tr key={index}>
                    <td>{new Date(item.data_interacao).toLocaleString()}</td>
                    <td>{item.tipo}</td>
                    <td>{item.usuario_nome || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Modal>
      </div>
    </SidebarGestor>
  );
}
