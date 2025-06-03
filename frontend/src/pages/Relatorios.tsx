import { useState } from 'react';
import {
  Container,
  Title,
  Button,
  Select,
  Table,
  Pagination,
  Card,
  Group,
  ScrollArea,
  Loader,
} from '@mantine/core';
import SidebarGestor from '../components/SidebarGestor';
import axios from 'axios';
import * as XLSX from 'xlsx';

export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(1);

  const registrosPorPagina = 10;

  const buscarRelatorio = async () => {
    if (!tipoRelatorio) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      let endpoint = '';

      switch (tipoRelatorio) {
        case 'interacoes':
          endpoint = '/relatorios/interacoes';
          break;
        case 'faturamento':
          endpoint = '/relatorios/faturamento';
          break;
        case 'oportunidades':
          endpoint = '/relatorios/oportunidades';
          break;
        case 'status':
          endpoint = '/relatorios/status';
          break;
        default:
          return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, { headers });
      setData(response.data);
    } catch (error) {
      console.error('Erro ao buscar o relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `${tipoRelatorio}_relatorio.xlsx`);
  };

  const dadosPaginados = data.slice(
    (pagina - 1) * registrosPorPagina,
    pagina * registrosPorPagina
  );

  return (
    <SidebarGestor tipoUser="ADMIN">
      <Container size="xl" mt="xl">
        <Title order={2} mb="md" ta="center" style={{ color: '#005A64' }}>
          Relatórios
        </Title>

        <Group mb="md" grow>
          <Select
            label="Tipo de Relatório"
            placeholder="Selecione o relatório"
            value={tipoRelatorio}
            onChange={setTipoRelatorio}
            data={[
              { value: 'interacoes', label: 'Relatório de Interações' },
              { value: 'faturamento', label: 'Relatório de Faturamento' },
              { value: 'oportunidades', label: 'Relatório de Oportunidades' },
              { value: 'status', label: 'Relatório de Status' },
            ]}
          />
        </Group>

        <Group justify="center" mt="md" mb="xl">
          <Button onClick={buscarRelatorio} disabled={!tipoRelatorio}>
            Buscar Relatório
          </Button>
        </Group>

        {loading ? (
          <Group justify="center" mt="xl">
            <Loader color="teal" />
          </Group>
        ) : (
          data.length > 0 && (
            <Card withBorder radius="md" mt="lg" shadow="sm">
              <Group justify="flex-end" mb="md">
                <Button variant="outline" color="green" size="xs" onClick={exportarExcel}>
                  Exportar Excel
                </Button>
              </Group>

              <ScrollArea>
                <Table highlightOnHover withColumnBorders striped>
                  <thead>
                    <tr>
                      {Object.keys(data[0] || {}).map((key) => (
                        <th key={key}>{key.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dadosPaginados.map((item, index) => (
                      <tr key={index}>
                        {Object.values(item).map((valor, idx) => (
                          <td key={idx}>{String(valor)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </ScrollArea>

              <Pagination
                total={Math.ceil(data.length / registrosPorPagina)}
                value={pagina}
                onChange={setPagina}
                mt="md"
              />
            </Card>
          )
        )}
      </Container>
    </SidebarGestor>
  );
}
