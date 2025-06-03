import { useEffect, useState } from 'react';
import {
  Container, Title, Button, Group, Select, Divider, ScrollArea, Table, Card
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import '@mantine/dates/styles.css';
import * as XLSX from 'xlsx';
import SidebarGestor from '../components/SidebarGestor';
import axios from 'axios';
import { DatesProvider } from '@mantine/dates';
import 'dayjs/locale/pt-br';

interface Parceiro {
  id: number;
  nome: string;
  status: string;
  faturamento: number;
  data: string;
}

export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);
  const [statusFiltro, setStatusFiltro] = useState<string | null>(null);
  const [dados, setDados] = useState<Parceiro[]>([]);

  const fetchRelatorioData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/relatorios/`, { headers });
      setDados(response.data);
    } catch (error) {
      console.error('Erro ao buscar dados de relatório:', error);
    }
  };

  useEffect(() => {
    fetchRelatorioData();
  }, []);

  const filtrarDados = () => {
    return dados.filter((item) => {
      const dataItem = new Date(item.data);
      const inicio = dataInicio;
      const fim = dataFim;
      const statusOk = statusFiltro ? item.status === statusFiltro : true;
      const dataOk =
        (!inicio || dataItem >= inicio) && (!fim || dataItem <= fim);

      return statusOk && dataOk;
    });
  };

  const exportToExcel = () => {
    const dadosFiltrados = filtrarDados();
    const ws = XLSX.utils.json_to_sheet(dadosFiltrados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `${tipoRelatorio || 'relatorio'}.xlsx`);
  };

  const dadosFiltrados = filtrarDados();

  return (
    <SidebarGestor tipoUser="GESTOR">
      <DatesProvider settings={{ locale: 'pt-br', firstDayOfWeek: 0 }}>
        <Container fluid style={{ padding: 20, maxWidth: '100%' }}>
          <Title order={2} mb="md" style={{ color: '#005A64' }}>
            Gerar Relatórios
          </Title>

          <Divider my="lg" />

          <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
            <Group grow mb="xl">
              <Select
                label="Tipo de Relatório"
                placeholder="Selecione"
                data={[
                  { label: 'Interações', value: 'interacoes' },
                  { label: 'Faturamento', value: 'faturamento' },
                  { label: 'Oportunidades', value: 'oportunidades' },
                ]}
                value={tipoRelatorio}
                onChange={setTipoRelatorio}
              />
              <DatePickerInput
                type="range"
                label="Período"
                placeholder="Selecione o período"
                value={[dataInicio, dataFim]}
                onChange={(range) => {
                  setDataInicio(range[0]);
                  setDataFim(range[1]);
                }}
                locale="pt-br"
              />
              <Select
                label="Status"
                placeholder="Selecione o status"
                data={[
                  { label: '30 dias', value: '30 dias' },
                  { label: '60 dias', value: '60 dias' },
                  { label: '90 dias', value: '90 dias' },
                  { label: '120 dias', value: '120 dias' },
                ]}
                value={statusFiltro}
                onChange={setStatusFiltro}
              />
            </Group>

            <Group justify="flex-end">
              <Button
                disabled={dadosFiltrados.length === 0}
                onClick={exportToExcel}
                variant="filled"
                color="teal"
              >
                Exportar Excel
              </Button>
            </Group>
          </Card>

          <Divider my="lg" />

          <Title order={4} mb="md">
            Preview de Dados ({dadosFiltrados.length})
          </Title>

          <ScrollArea>
            <Table striped highlightOnHover withColumnBorders>
              <thead style={{ backgroundColor: '#f1f3f5' }}>
                <tr>
                  <th>Nome</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Faturamento</th>
                  <th style={{ textAlign: 'center' }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {dadosFiltrados.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.nome}</td>
                    <td>{item.status}</td>
                    <td style={{ textAlign: 'center' }}>
                      R$ {Number(item.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {new Date(item.data).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </ScrollArea>
        </Container>
      </DatesProvider>
    </SidebarGestor>
  );
}
