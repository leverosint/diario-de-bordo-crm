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
} from '@mantine/core';
import SidebarGestor from '../components/SidebarGestor';

interface Interacao {
  id: number;
  parceiro: string;
  unidade: string;
  classificacao: string;
  status: string;
}

export default function InteracoesPage() {
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const tipoUser = JSON.parse(localStorage.getItem('usuario') || '{}')?.tipo_user;

  useEffect(() => {
    const rawToken = localStorage.getItem('token');
    const token = rawToken?.replace(/^"|"$/g, ''); // remove aspas duplas se houver

    console.log('🔐 Token usado:', token);

    if (!token) {
      setErro('Você precisa fazer login novamente.');
      setCarregando(false);
      return;
    }

    axios
      .get(`${import.meta.env.VITE_API_URL}/interacoes/pendentes/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (Array.isArray(response.data)) {
          setInteracoes(response.data);
        } else {
          setErro('Dados inválidos recebidos da API.');
          console.error('⚠️ Resposta não é array:', response.data);
        }
      })
      .catch((err) => {
        console.error('❌ Erro ao buscar interações:', err);
        if (err.response?.status === 401) {
          setErro('Sessão expirada. Faça login novamente.');
        } else {
          setErro('Erro ao carregar interações. Verifique sua conexão ou login.');
        }
      })
      .finally(() => setCarregando(false));
  }, []);

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <Text fw={700} size="xl" mb="md">
        Interações de Parceiros Pendentes
      </Text>

      {carregando ? (
        <Center>
          <Loader />
        </Center>
      ) : erro ? (
        <Center>
          <Alert color="red" title="Erro">{erro}</Alert>
        </Center>
      ) : interacoes.length === 0 ? (
        <Center>
          <Text>Nenhuma interação pendente encontrada.</Text>
        </Center>
      ) : (
        <ScrollArea>
          <Table striped highlightOnHover withTableBorder>
            <TableThead>
              <TableTr>
                <TableTh>Parceiro</TableTh>
                <TableTh>Unidade</TableTh>
                <TableTh>Classificação</TableTh>
                <TableTh>Status</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {interacoes.map((interacao) => (
                <TableTr key={interacao.id}>
                  <TableTd>{interacao.parceiro}</TableTd>
                  <TableTd>{interacao.unidade}</TableTd>
                  <TableTd>{interacao.classificacao}</TableTd>
                  <TableTd>{interacao.status}</TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        </ScrollArea>
      )}
    </SidebarGestor>
  );
}
