import { useState } from 'react';
import { Container, Title, Button, Group, Select, Divider } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates'; // Aqui vem de @mantine/dates!
import * as XLSX from 'xlsx';
import SidebarGestor from '../components/SidebarGestor';
import type { DateValue } from '@mantine/dates'; // Corrigido: Import de tipo separado!

export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState<DateValue>(null);
  const [dataFim, setDataFim] = useState<DateValue>(null);

  const gerarRelatorio = () => {
    console.log('Gerar relatório de:', tipoRelatorio, 'De', dataInicio, 'Até', dataFim);

    const dadosExemplo = [
      { Nome: 'Cliente A', Faturamento: 10000, Data: '2025-06-01' },
      { Nome: 'Cliente B', Faturamento: 20000, Data: '2025-06-02' },
    ];

    const ws = XLSX.utils.json_to_sheet(dadosExemplo);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `${tipoRelatorio || 'relatorio'}.xlsx`);
  };

  return (
    <SidebarGestor tipoUser="GESTOR">
      <Container style={{ padding: 20 }}>
        <Title order={2} mb="md">Gerar Relatórios</Title>

        <Divider my="lg" />

        <Group mb="xl">
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
            label="Data Início"
            value={dataInicio}
            onChange={setDataInicio}
            placeholder="Selecione a data inicial"
          />
          <DatePickerInput
            label="Data Fim"
            value={dataFim}
            onChange={setDataFim}
            placeholder="Selecione a data final"
          />
        </Group>

        <Button disabled={!tipoRelatorio || !dataInicio || !dataFim} onClick={gerarRelatorio}>
          Gerar e Exportar Relatório
        </Button>
      </Container>
    </SidebarGestor>
  );
}
