import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table,
  Title,
  Text,
  Group,
  Select,
  Badge,
  Paper,
  Loader,
} from '@mantine/core';
import { IconCircleCheck, IconCircleX } from '@tabler/icons-react';


type Oportunidade = {
  id: number;
  parceiro: string;
  unidade: string;
  classificacao: string;
  status: string;
  flag_entrou_contato: boolean;
  tipo_oportunidade: string;
};

export default function TabelaOportunidadesPage() {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [filtro, setFiltro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarOportunidades = async () => {
      try {
        const response = await axios.get('/api/oportunidades/');
        setOportunidades(response.data);
      } catch (error) {
        console.error('Erro ao buscar oportunidades:', error);
      } finally {
        setLoading(false);
      }
    };

    buscarOportunidades();
  }, []);

  const oportunidadesFiltradas = filtro
    ? oportunidades.filter((o) => o.tipo_oportunidade === filtro)
    : oportunidades;

  const renderStatus = (status: string) => {
    switch (status) {
      case 'Recorrente':
        return <Badge color="green" leftSection={<IconCircleCheck size={14} />} variant="light">{status}</Badge>;
      case '30d s/ Fat':
        return <Badge color="yellow" variant="light">{status}</Badge>;
      case '60d s/ Fat':
        return <Badge color="orange" variant="light">{status}</Badge>;
      case '90d s/ Fat':
        return <Badge color="red" variant="light">{status}</Badge>;
      case '120d s/ Fat':
        return <Badge color="dark" variant="light">{status}</Badge>;
      default:
        return <Badge color="gray" variant="light">{status}</Badge>;
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <Title order={2} mb="md">Tabela de Oportunidades</Title>

      <Group mb="md" justify="flex-start">
        <Select
          label="Filtrar por tipo de oportunidade"
          placeholder="Selecione o tipo"
          value={filtro}
          onChange={setFiltro}
          data={[...new Set(oportunidades.map((o) => o.tipo_oportunidade))].map((tipo) => ({
            value: tipo,
            label: tipo,
          }))}
          clearable
        />
      </Group>

      {loading ? (
        <Group justify="center" mt="xl">
          <Loader />
          <Text>Carregando oportunidades...</Text>
        </Group>
      ) : (
        <Paper shadow="xs" p="md" radius="md">
          <div style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover withTableBorder>
              <thead>
                <tr>
                  <th>Parceiro</th>
                  <th>Unidade</th>
                  <th>Classificação</th>
                  <th>Status</th>
                  <th>Entrou em contato</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {oportunidadesFiltradas.map((o) => (
                  <tr key={o.id}>
                    <td>{o.parceiro}</td>
                    <td>{o.unidade}</td>
                    <td>{o.classificacao}</td>
                    <td>{renderStatus(o.status)}</td>
                    <td>
                      {o.flag_entrou_contato ? (
                        <IconCircleCheck size={20} color="green" />
                      ) : (
                        <IconCircleX size={20} color="gray" />
                      )}
                    </td>
                    <td>{o.tipo_oportunidade}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Paper>
      )}
    </div>
  );
}
