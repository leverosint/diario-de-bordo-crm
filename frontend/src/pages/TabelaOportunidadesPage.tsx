import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table,
  Title,
  Text,
  Group,
  Select,
  Badge,
  Loader,
  Paper,
} from '@mantine/core';
import SidebarGestor from '../components/SidebarGestor';
import styles from './OportunidadesPage.module.css';

interface Oportunidade {
  id: number;
  parceiro: string;
  classificacao: string;
  status: string;
  data: string;
}

export default function TabelaOportunidadesPage() {
  const [dados, setDados] = useState<Oportunidade[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const tipoUser = JSON.parse(localStorage.getItem('usuario') || '{}')?.tipo_user || 'VENDEDOR';
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get('/api/oportunidades/', { headers });
        setDados(response.data || []);
      } catch (error) {
        console.error('Erro ao buscar oportunidades:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  const oportunidadesFiltradas = filtroStatus
    ? dados.filter(o => o.status === filtroStatus)
    : dados;

  const renderStatus = (status: string) => {
    const cor =
      status === 'Recorrente' ? 'green' :
      status.includes('30') ? 'yellow' :
      status.includes('60') ? 'orange' :
      'red';
    return <Badge color={cor}>{status}</Badge>;
  };

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <div className={styles.container}>
        <Title order={2} mb="md">Oportunidades</Title>

        <Group justify="flex-start" mb="md">
          <Select
            label="Filtrar por status"
            placeholder="Selecione"
            data={['Aberto', 'Fechado']}
            value={filtroStatus}
            onChange={setFiltroStatus}
            clearable
          />
        </Group>

        {loading ? (
          <Loader />
        ) : (
          <Paper shadow="xs" p="md" withBorder className={styles.tabelaWrapper}>
            <Table striped highlightOnHover withTableBorder>
              <thead>
                <tr>
                  <th>Parceiro</th>
                  <th>Classificação</th>
                  <th>Status</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {oportunidadesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <Text>Nenhuma oportunidade encontrada.</Text>
                    </td>
                  </tr>
                ) : (
                  oportunidadesFiltradas.map((oportunidade) => (
                    <tr key={oportunidade.id}>
                      <td>{oportunidade.parceiro}</td>
                      <td>{oportunidade.classificacao}</td>
                      <td>{renderStatus(oportunidade.status)}</td>
                      <td>{new Date(oportunidade.data).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Paper>
        )}
      </div>
    </SidebarGestor>
  );
}
