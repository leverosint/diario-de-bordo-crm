import { useState } from 'react';
import { Container, Select, Button, Table, Title, Group, Pagination } from '@mantine/core';
import SidebarGestor from '../components/SidebarGestor';
import * as XLSX from 'xlsx';
import axios from 'axios';

export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState<string>('parceiros');
  const [dados, setDados] = useState<any[]>([]);
  const [pagina, setPagina] = useState(1);
  const registrosPorPagina = 10;

  const buscarRelatorio = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      let endpoint = '';

      if (tipoRelatorio === 'parceiros') {
        endpoint = `${import.meta.env.VITE_API_URL}/relatorios/parceiros/`;
      } else if (tipoRelatorio === 'interacoes') {
        endpoint = `${import.meta.env.VITE_API_URL}/interacoes/`;
      } else if (tipoRelatorio === 'oportunidades') {
        endpoint = `${import.meta.env.VITE_API_URL}/oportunidades/`;
      }
      

      const response = await axios.get(endpoint, { headers });

      if (tipoRelatorio === 'parceiros') {
        const parceirosTratados = response.data.map((item: any) => ({
          ...item,
          canal_venda: item.canal_venda?.nome || '',
        }));
        setDados(parceirosTratados);
      } else {
        setDados(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
    }
  };

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `${tipoRelatorio}.xlsx`);
  };

  const dadosPaginados = dados.slice((pagina - 1) * registrosPorPagina, pagina * registrosPorPagina);

  // Traduções de colunas
  const traducoes: { [key: string]: string } = {
    parceiro: 'Nome do Parceiro',
    codigo: 'Código',
    classificacao: 'Classificação',
    consultor: 'Consultor',
    consultor_id:   'ID do Consultor',
    consultor_nome: 'Nome do Consultor',
    unidade: 'Unidade',
    cidade: 'Cidade',
    uf: 'UF',
    canal_venda: 'Canal de Venda',
    total_geral: 'Total Geral (R$)',
    tm: 'Ticket Médio (R$)',
    recorrencia: 'Recorrência',
    status: 'Status',
    primeiro_fat: 'Primeiro Faturamento',
    ultimo_fat: 'Último Faturamento',
    atualizado_em: 'Atualizado Em',
    parceiro_nome: 'Nome do Parceiro',
    usuario_nome: 'Usuário',
    tipo: 'Tipo de Interação',
    data_interacao: 'Data da Interação',
    entrou_em_contato: 'Entrou em Contato',
    valor: 'Valor (R$)',
    etapa: 'Etapa',
    observacao: 'Observação',
    data_criacao: 'Data de Criação',
  };

  return (
    <SidebarGestor tipoUser={localStorage.getItem('tipo_user') || ''}>
      <Container size="xl" py="xl">
        <Title order={2} mb="md" style={{ color: '#005A64', textAlign: 'center' }}>
          Relatórios
        </Title>

        <Group mt="md" mb="xl">
          <Select
            label="Escolha o tipo de relatório"
            placeholder="Selecione"
            value={tipoRelatorio}
            onChange={(value) => setTipoRelatorio(value || 'parceiros')}
            data={[
              { value: 'parceiros', label: 'Parceiros' },
              { value: 'interacoes', label: 'Interações' },
              { value: 'oportunidades', label: 'Oportunidades' },
            ]}
          />
          <Button onClick={buscarRelatorio} color="teal">Buscar Relatório</Button>
          <Button onClick={exportarExcel} variant="outline">Exportar Excel</Button>
        </Group>

        <Table striped highlightOnHover withTableBorder>
          <thead>
            <tr>
              {dados.length > 0 &&
                Object.keys(dados[0] ?? {}).map((key) => (
                  <th key={key}>
                    {traducoes[key] || key.toUpperCase()}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {dadosPaginados.map((item, index) => (
              <tr key={index}>
                {Object.values(item).map((value, i) => (
                  <td key={i}>{String(value)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>

        <Group mt="md" justify="center">
          <Pagination
            total={Math.ceil(dados.length / registrosPorPagina)}
            value={pagina}
            onChange={setPagina}
          />
        </Group>
      </Container>
    </SidebarGestor>
  );
}
