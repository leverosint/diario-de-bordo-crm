import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Title, Table, Container, Loader, ScrollArea, Badge, Group, Text, Divider,
  Card, Box, Select, TextInput, Button
} from '@mantine/core';
import SidebarGestor from '../components/SidebarGestor';
import * as XLSX from 'xlsx';

interface Oportunidade {
  id: number;
  parceiro: number;
  parceiro_nome: string;
  valor: number;
  etapa: string;
  data_criacao: string;
  data_status?: string;
}

export default function OportunidadesPage() {
  const [dados, setDados] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroParceiro, setFiltroParceiro] = useState('');

  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const etapaOptions = [
    { value: 'Oportunidade', label: 'Oportunidade' },
    { value: 'Orçamento', label: 'Orçamento' },
    { value: 'Pedido Aguardando Aprovação', label: 'Pedido Aguardando Aprovação' },
    { value: 'Pedido Realizado', label: 'Pedido Realizado' },
    { value: 'Venda Perdida', label: 'Venda Perdida' },
  ];

  const fetchDados = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/oportunidades/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDados(res.data);
    } catch (err) {
      console.error('Erro ao buscar oportunidades:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, [token]);

  const handleStatusChange = async (id: number, value: string | null) => {
    if (!value) return;
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/oportunidades/${id}/`, {
        etapa: value
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDados();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const exportarParaExcel = () => {
    const ws = XLSX.utils.json_to_sheet(dadosFiltrados.map(o => ({
      Parceiro: o.parceiro_nome,
      Valor: o.valor,
      'Data Criação': formatDate(o.data_criacao),
      'Data Status': formatDate(o.data_status),
      Status: o.etapa,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Oportunidades');
    XLSX.writeFile(wb, 'Oportunidades.xlsx');
  };

  const getStatusColor = (etapa: string) => {
    const cores: Record<string, string> = {
      'Oportunidade': '#228be6',
      'Orçamento': '#f59f00',
      'Pedido Aguardando Aprovação': '#fab005',
      'Pedido Realizado': '#40c057',
      'Venda Perdida': '#fa5252',
    };
    return cores[etapa] || '#ced4da';
  };

  const getEtapaTitulo = (etapa: string, qtd: number) => {
    const nomes: Record<string, string> = {
      'Oportunidade': 'oportunidade',
      'Orçamento': 'orçamento',
      'Pedido Aguardando Aprovação': 'pedido aguardando aprovação',
      'Pedido Realizado': 'pedido realizado',
      'Venda Perdida': 'oportunidade perdida',
    };
    const tipo = nomes[etapa] || 'oportunidade';
    return `${qtd} ${tipo}${qtd > 1 ? 's' : ''}`;
  };

  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleDateString('pt-BR') : '-';

  const dadosFiltrados = useMemo(() => {
    return dados.filter((o) =>
      o.parceiro_nome.toLowerCase().includes(filtroParceiro.toLowerCase())
    );
  }, [dados, filtroParceiro]);

  const agrupadoPorEtapa = useMemo(() => {
    const map: Record<string, Oportunidade[]> = {};
    dadosFiltrados.forEach(o => {
      const key = o.etapa || 'Sem etapa';
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return map;
  }, [dadosFiltrados]);

  return (
    <SidebarGestor tipoUser={usuario.tipo_user}>
      <Container fluid>
        <Title order={2} mb="md">Oportunidades por Status</Title>
        <Group justify="space-between" mb="md" wrap="wrap">
          <TextInput
            placeholder="Filtrar por parceiro"
            value={filtroParceiro}
            onChange={(e) => setFiltroParceiro(e.currentTarget.value)}
            w={300}
          />
          <Button onClick={exportarParaExcel} color="green">Exportar Excel</Button>
        </Group>

        {carregando ? <Loader /> : (
          <ScrollArea>
            {Object.entries(agrupadoPorEtapa).map(([etapa, lista]) => (
              <Box key={etapa} mt="xl">
                <Card withBorder shadow="lg" radius="lg" p="lg" mb="xl" style={{ background: '#f9f9f9' }}>
                  <Group justify="space-between" mb="sm">
                    <Title order={4} style={{ textTransform: 'capitalize' }}>{etapa.toLowerCase()}</Title>
                    <Badge color={getStatusColor(etapa)} variant="light" radius="xl">
                      {getEtapaTitulo(etapa, lista.length)}
                    </Badge>
                  </Group>
                  <Divider my="sm" />
                  <Table striped highlightOnHover withColumnBorders>
                    <thead>
                      <tr>
                        <th>Parceiro</th>
                        <th>Valor</th>
                        <th>Data Criação</th>
                        <th>Data Status</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((o) => (
                        <tr key={o.id}>
                          <td><Text fw={500}>{o.parceiro_nome}</Text></td>
                          <td>R$ {o.valor.toLocaleString('pt-BR')}</td>
                          <td>{formatDate(o.data_criacao)}</td>
                          <td>{formatDate(o.data_status)}</td>
                          <td>
                            <Select
                              value={o.etapa}
                              onChange={(value) => handleStatusChange(o.id, value)}
                              data={etapaOptions}
                              styles={{
                                input: {
                                  backgroundColor: getStatusColor(o.etapa),
                                  color: 'white',
                                  fontWeight: 600,
                                  borderRadius: 8,
                                  textAlign: 'center',
                                },
                                dropdown: { zIndex: 9999 }
                              }}
                              size="xs"
                              withinPortal
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              </Box>
            ))}
          </ScrollArea>
        )}
      </Container>
    </SidebarGestor>
  );
}
