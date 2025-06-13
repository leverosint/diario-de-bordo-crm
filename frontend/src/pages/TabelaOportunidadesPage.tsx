import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Badge,
  Card,
  Group,
  LoadingOverlay,
  Select,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import SidebarGestor from '../components/SidebarGestor';
import styles from './oportunidadespage.module.css'; // ✅ Novo CSS

interface Oportunidade {
  id: number;
  parceiro: string;
  etapa: string;
  status: string;
  valor: number;
  tempo_medio: number;
}

function TabelaOportunidadesPage() {
  const [dados, setDados] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null);

  useEffect(() => {
    async function buscar() {
      setCarregando(true);
      try {
        const res = await axios.get('/api/oportunidades');
        setDados(res.data);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      } finally {
        setCarregando(false);
      }
    }

    buscar();
  }, []);

  const dadosFiltrados = filtroStatus
    ? dados.filter((item) => item.status === filtroStatus)
    : dados;

  return (
    <SidebarGestor tipoUser="GESTOR">
      <div className={styles.pageContainer}>
        <LoadingOverlay visible={carregando} />
        <Title order={2} mb="md">Oportunidades</Title>

        <Group position="left" mb="md">
          <Select
            label="Filtrar por status"
            placeholder="Selecione"
            data={['Aberto', 'Fechado']}
            value={filtroStatus}
            onChange={setFiltroStatus}
            clearable
          />
        </Group>

        <Card withBorder radius="md" shadow="sm">
          <Table highlightOnHover>
            <thead>
              <tr>
                <th>Parceiro</th>
                <th>Etapa</th>
                <th>Status</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>{item.parceiro}</td>
                  <td>
                    <Tooltip label={`Tempo médio: ${item.tempo_medio} dias`}>
                      <Badge color="blue">{item.etapa}</Badge>
                    </Tooltip>
                  </td>
                  <td>
                    <Badge color={item.status === 'Aberto' ? 'green' : 'gray'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td>
                    <Text>R$ {item.valor.toLocaleString('pt-BR')}</Text>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </SidebarGestor>
  );
}

export default TabelaOportunidadesPage;
