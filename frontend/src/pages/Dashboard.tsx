import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Grid,
  Card,
  Title,
  Text,
  Loader,
} from '@mantine/core';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';
import SidebarGestor from '../components/SidebarGestor';

export default function Dashboard() {
  const navigate = useNavigate();
  const [tipoUser, setTipoUser] = useState<string | null>(null);
  const [kpis, setKpis] = useState<any[]>([]);
  const [dadosFunil, setDadosFunil] = useState<any[]>([]);
  const [dadosBarra, setDadosBarra] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [kpiRes, funilRes, barraRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/dashboard/kpis/`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/dashboard/funil/`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/dashboard/oportunidades-mensais/`, { headers }),
      ]);

      setKpis(kpiRes.data);
      setDadosFunil(funilRes.data);
      setDadosBarra(barraRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '');
      if (!usuario?.tipo_user) {
        navigate('/');
        return;
      }
      setTipoUser(usuario.tipo_user);
      fetchDashboardData();
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      navigate('/');
    }
  }, [token, navigate]);

  if (!token || !tipoUser) return null;

  if (loading) {
    return (
      <SidebarGestor tipoUser={tipoUser}>
        <div style={{ padding: 20 }}>
          <Loader />
        </div>
      </SidebarGestor>
    );
  }

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <div style={{ padding: 20 }}>
        <Title order={2} mb="md">
          {tipoUser === 'GESTOR' && 'Dashboard do Gestor'}
          {tipoUser === 'VENDEDOR' && 'Dashboard do Vendedor'}
          {tipoUser === 'ADMIN' && 'Dashboard do Administrador'}
        </Title>

        {/* KPIs */}
        <Grid mb="xl">
          {kpis.map((kpi) => (
            <Grid.Col span={3} key={kpi.title}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={4}>{kpi.title}</Title>
                <Text size="xl" weight={700}>
                  {kpi.value}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* Funil e Evolução Mensal */}
        <Grid>
          {/* Funil de Conversão */}
          <Grid.Col span={6}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={4} mb="md">Funil de Conversão</Title>
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Funnel dataKey="value" data={dadosFunil} isAnimationActive>
                    <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </Card>
          </Grid.Col>

          {/* Gráfico de Barras */}
          <Grid.Col span={6}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={4} mb="md">Evolução Mensal de Oportunidades</Title>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosBarra}>
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="oportunidades" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid.Col>
        </Grid>
      </div>
    </SidebarGestor>
  );
}
