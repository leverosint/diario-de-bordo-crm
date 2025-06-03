import { useState } from 'react';
import {
  Container, Title, Button, Table, ScrollArea, Card, Loader, Group, Select, Grid
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates'; // Atenção: Mantine Dates v5 usa STRING
import SidebarGestor from '../components/SidebarGestor';
import axios from 'axios';
import * as XLSX from 'xlsx';

export default function Relatorios() {
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<string | null>(null);
  const [dataInicial, setDataInicial] = useState<string | null>(null);
  const [dataFinal, setDataFinal] = useState<string | null>(null);
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const tipoUser = JSON.parse(localStorage.getItem('usuario') || '{}')?.tipo_user || '';

  const buscarRelatorio = async () => {
    if (!relatorioSelecionado) return;

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      let endpoint = '';
      if (relatorioSelecionado === 'interacoes') endpoint = '/dashboard/interacoes/';
      if (relatorioSelecionado === 'faturamento') endpoint = '/dashboard/faturamento/';
      if (relatorioSelecionado === 'oportunidades') endpoint = '/dashboard/oportunidades/';
      if (relatorioSelecionado === 'status') endpoint = '/dashboard/status/';

      const response = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        headers,
        params: {
          data_inicial: dataInicial,
          data_final: dataFinal,
        },
      });

      setDados(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = () => {
    if (!dados.length) return;

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatorio');
    XLSX.writeFile(wb, `relatorio-${relatorioSelecionado}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Container fluid style={{ padding: 20, maxWidth: '100%' }}>
        <Title order={2} style={{ color: '#005A64', marginBottom: '20px' }}>
          Relatórios
        </Title>

        <Card withBorder shadow="md" mb="lg">
          <Grid>
            <Grid.Col span={4}>
              <Select
                label="Tipo de Relatório"
                placeholder="Selecione o relatório"
                data={[
                  { value: 'interacoes', label: 'Relatório de Interações' },
                  { value: 'faturamento', label: 'Relatório de Faturamento' },
                  { value: 'oportunidades', label: 'Relatório de Oportunidades' },
                  { value: 'status', label: 'Relatório de Status' },
                ]}
                value={relatorioSelecionado}
                onChange={setRelatorioSelecionado}
                size="md"
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <DatePickerInput
                label="Data Inicial"
                placeholder="Selecione a data inicial"
                value={dataInicial}
                onChange={setDataInicial}
                locale="pt-br"
                size="md"
                valueFormat="DD/MM/YYYY"
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <DatePickerInput
                label="Data Final"
                placeholder="Selecione a data final"
                value={dataFinal}
                onChange={setDataFinal}
                locale="pt-br"
                size="md"
                valueFormat="DD/MM/YYYY"
              />
            </Grid.Col>
          </Grid>

          <Group mt="md">
            <Button onClick={buscarRelatorio} color="teal" size="md">
              Buscar Relatório
            </Button>
            <Button onClick={exportarExcel} color="blue" size="md" disabled={!dados.length}>
              Exportar Excel
            </Button>
          </Group>
        </Card>

        {loading ? (
          <Loader size="xl" color="teal" />
        ) : (
          <>
            {dados.length > 0 && (
              <Card withBorder shadow="sm">
                <ScrollArea>
                  <Table striped highlightOnHover withColumnBorders>
                    <thead>
                      <tr>
                        {Object.keys(dados[0] || {}).map((key) => (
                          <th key={key}>{key.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dados.map((item, index) => (
                        <tr key={index}>
                          {Object.values(item).map((value, idx) => (
                            <td key={idx}>{String(value)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </ScrollArea>
              </Card>
            )}
          </>
        )}
      </Container>
    </SidebarGestor>
  );
}
