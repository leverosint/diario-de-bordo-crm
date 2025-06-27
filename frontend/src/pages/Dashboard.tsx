// dashboard.tsx
import { useEffect, useState } from 'react';
import {
  Container, Grid, Card, Text, Title, Select, Loader, Group
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';

interface KPI {
  title: string;
  value: string | number;
}

interface ResumoParceiro {
  parceiro_id: number;
  codigo: string;
  parceiro: string;
  consultor: string;
  unidade: string;
  status_parceiro: string;
  data_ref: string;
  total_interacoes: number;
  interacoes_whatsapp: number;
  interacoes_ligacao: number;
  interacoes_email: number;
  total_oportunidades: number;
  valor_total_oportunidades: number;
}

interface DashboardProps {
  user: any;
}

const Dashboard = ({ user }: DashboardProps) => {
  const [mes, setMes] = useState<Date | null>(new Date());
  const [consultor, setConsultor] = useState<string | null>(null);
  const [consultores, setConsultores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resumo, setResumo] = useState<ResumoParceiro[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);

  const fetchConsultores = async () => {
    const { data } = await axios.get('/api/usuarios/report/');
    setConsultores(data);
  };

  const fetchResumo = async () => {
    setLoading(true);
    const params: any = {
      mes: dayjs(mes).month() + 1,
      ano: dayjs(mes).year()
    };
    if (user.tipo_user !== 'VENDEDOR' && consultor) {
      params.consultor = consultor;
    }

    const { data } = await axios.get('/api/dashboard/resumo-parceiros/', { params });
    setResumo(data);
    gerarKPIs(data);
    setLoading(false);
  };

  const gerarKPIs = (data: ResumoParceiro[]) => {
    const totalCarteira = data.length;
    const totalContactados = new Set(data.filter(d => d.total_interacoes > 0).map(d => d.parceiro_id)).size;
    const totalInteracoes = data.reduce((acc, d) => acc + d.total_interacoes, 0);
    const totalOportunidades = data.reduce((acc, d) => acc + d.total_oportunidades, 0);
    const valorTotal = data.reduce((acc, d) => acc + Number(d.valor_total_oportunidades), 0);
    const taxaContato = totalCarteira > 0 ? (totalContactados / totalCarteira) * 100 : 0;

    setKpis([
      { title: 'Carteira Total', value: totalCarteira },
      { title: 'Parceiros Contactados', value: totalContactados },
      { title: '% Contactados', value: `${taxaContato.toFixed(1)}%` },
      { title: 'Total Interações', value: totalInteracoes },
      { title: 'Total Oportunidades', value: totalOportunidades },
      { title: 'Valor Total', value: `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
    ]);
  };

  useEffect(() => {
    if (user.tipo_user !== 'VENDEDOR') {
      fetchConsultores();
    }
  }, []);

  useEffect(() => {
    fetchResumo();
  }, [mes, consultor]);

  const statusDistribuicao = resumo.reduce((acc, cur) => {
    acc[cur.status_parceiro] = (acc[cur.status_parceiro] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalCarteira = resumo.length;
  const statusChart = Object.entries(statusDistribuicao).map(([key, value]) => ({
    status: key,
    percentual: ((value / totalCarteira) * 100).toFixed(1),
    total: value
  }));

  const interacoesPorTipo = [
    {
      tipo: 'WhatsApp',
      total: resumo.reduce((acc, d) => acc + d.interacoes_whatsapp, 0)
    },
    {
      tipo: 'Ligação',
      total: resumo.reduce((acc, d) => acc + d.interacoes_ligacao, 0)
    },
    {
      tipo: 'E-mail',
      total: resumo.reduce((acc, d) => acc + d.interacoes_email, 0)
    }
  ];

  return (
    <Container fluid>
      <Group justify="space-between" mb="md">
        <MonthPickerInput
          label="Mês de referência"
          value={mes}
          onChange={(val) => {
            if (val && typeof val === 'object' && 'getMonth' in val) {
              setMes(val as Date);
            }
          }}
          valueFormat="MM/YYYY"
        />

        {user.tipo_user !== 'VENDEDOR' && (
          <Select
            label="Consultor"
            data={consultores.map(c => ({ value: c.id_vendedor, label: c.nome }))}
            value={consultor}
            onChange={setConsultor}
            clearable
          />
        )}
      </Group>

      {loading ? <Loader /> : (
        <>
          <Grid>
            {kpis.map((kpi, i) => (
              <Grid.Col span={4} key={i}>
                <Card shadow="sm" padding="md">
                  <Title order={4}>{kpi.title}</Title>
                  <Text size="lg" fw={700}>{kpi.value}</Text>
                </Card>
              </Grid.Col>
            ))}
          </Grid>

          <Title order={3} mt="lg">Distribuição por Status</Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusChart}>
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip formatter={(value: any) => `${value}%`} />
              <Legend />
              <Bar dataKey="percentual" fill="#005A64" />
            </BarChart>
          </ResponsiveContainer>

          <Title order={3} mt="lg">Interações por Tipo</Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={interacoesPorTipo}>
              <XAxis dataKey="tipo" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#0099CC" />
            </BarChart>
          </ResponsiveContainer>

          <Title order={3} mt="lg">Resumo dos Parceiros</Title>
          <Grid>
            {resumo.map((r) => (
              <Grid.Col span={4} key={r.parceiro_id}>
                <Card>
                  <Text fw={700}>{r.parceiro}</Text>
                  <Text size="sm">Status: {r.status_parceiro}</Text>
                  <Text size="sm">Consultor: {r.consultor}</Text>
                  <Text size="sm">Unidade: {r.unidade}</Text>
                  <Text size="sm">Referência: {dayjs(r.data_ref).format('MM/YYYY')}</Text>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default Dashboard;