import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table,
  Loader,
  Center,
  Text,
  ScrollArea,
  TableThead,
  TableTbody,
  TableTr,
  TableTh,
  TableTd,
  Alert,
  Button,
  Group,
  Title,
  Divider,
  Badge,
} from '@mantine/core';
import SidebarGestor from '../components/SidebarGestor';

interface Interacao {
  id: number;
  parceiro: string;
  unidade: string;
  classificacao: string;
  status: string;
  entrou_em_contato?: boolean;
  data_interacao?: string;
  tipo?: string;
}

export default function InteracoesPage() {
  const [pendentes, setPendentes] = useState<Interacao[]>([]);
  const [interagidos, setInteragidos] = useState<Interacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [metaAtual, setMetaAtual] = useState(0);
  const [metaTotal, setMetaTotal] = useState(10);
  const tipoUser = JSON.parse(localStorage.getItem('usuario') || '{}')?.tipo_user;
  const token = localStorage.getItem('token');

  const carregarDados = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [resPendentes, resInteragidos, resMeta] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/interacoes/pendentes/?tipo=pendentes`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/interacoes/pendentes/?tipo=interagidos`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/interacoes/pendentes/metas/`, { headers }),
      ]);

      setPendentes(resPendentes.data);
      setInteragidos(resInteragidos.data);
      setMetaAtual(resMeta.data.interacoes_realizadas);
      setMetaTotal(resMeta.data.meta_diaria);
    } catch (err) {
      console.error('Erro ao carregar interações:', err);
      setErro('Erro ao carregar interações. Verifique sua conexão ou login.');
    } finally {
      setCarregando(false);
    }
  };

  const registrarInteracao = async (parceiroId: number) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/registrar-interacao/`, {
        parceiro: parceiroId,
        tipo: 'LIGACAO',
        entrou_em_contato: true,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await carregarDados();
    } catch (err) {
      console.error('Erro ao registrar interação:', err);
      alert('Erro ao registrar interação. Tente novamente.');
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Title order={2} mb="xs">Interações de Parceiros Pendentes</Title>

      <Group position="apart" mb="md">
        <Badge color={metaAtual >= metaTotal ? 'teal' : 'yellow'} size="lg">
          Meta do dia: {metaAtual}/{metaTotal}
        </Badge>
      </Group>

      {carregando ? (
        <Center><Loader /></Center>
      ) : erro ? (
        <Center><Alert color="red" title="Erro">{erro}</Alert></Center>
      ) : (
        <>
          <Divider label="A Interagir" mb="xs" />

          {pendentes.length === 0 ? (
            <Text>Nenhuma interação pendente encontrada.</Text>
          ) : (
            <ScrollArea>
              <Table striped highlightOnHover withTableBorder>
                <TableThead>
                  <TableTr>
                    <TableTh>Parceiro</TableTh>
                    <TableTh>Unidade</TableTh>
                    <TableTh>Classificação</TableTh>
                    <TableTh>Status</TableTh>
                    <TableTh>Ação</TableTh>
                  </TableTr>
                </TableThead>
                <TableTbody>
                  {pendentes.map((item) => (
                    <TableTr key={item.id}>
                      <TableTd>{item.parceiro}</TableTd>
                      <TableTd>{item.unidade}</TableTd>
                      <TableTd>{item.classificacao}</TableTd>
                      <TableTd>{item.status}</TableTd>
                      <TableTd>
                        <Button size="xs" onClick={() => registrarInteracao(item.id)}>
                          Marcar como interagido
                        </Button>
                      </TableTd>
                    </TableTr>
                  ))}
                </TableTbody>
              </Table>
            </ScrollArea>
          )}

          <Divider label="Interagidos Hoje" mt="lg" mb="xs" />

          {interagidos.length === 0 ? (
            <Text>Nenhum parceiro interagido hoje.</Text>
          ) : (
            <ScrollArea>
              <Table striped highlightOnHover withTableBorder>
                <TableThead>
                  <TableTr>
                    <TableTh>Parceiro</TableTh>
                    <TableTh>Unidade</TableTh>
                    <TableTh>Classificação</TableTh>
                    <TableTh>Status</TableTh>
                    <TableTh>Data</TableTh>
                  </TableTr>
                </TableThead>
                <TableTbody>
                  {interagidos.map((item) => (
                    <TableTr key={item.id}>
                      <TableTd>{item.parceiro}</TableTd>
                      <TableTd>{item.unidade}</TableTd>
                      <TableTd>{item.classificacao}</TableTd>
                      <TableTd>{item.status}</TableTd>
                      <TableTd>{item.data_interacao ? new Date(item.data_interacao).toLocaleString() : ''}</TableTd>
                    </TableTr>
                  ))}
                </TableTbody>
              </Table>
            </ScrollArea>
          )}
        </>
      )}
    </SidebarGestor>
  );
}
