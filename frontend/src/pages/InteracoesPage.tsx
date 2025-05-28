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
  const tipoUser = JSON.parse(localStorage.getItem('usuario') || '{}')?.tipo_user;

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get(`${import.meta.env.VITE_API_URL}/interacoes/pendentes/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setInteracoes(response.data);
      })
      .catch((err) => {
        console.error('Erro ao buscar interações:', err);
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
