import { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Loader, Center, Text, ScrollArea } from '@mantine/core';
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
          <Table
            striped
            withColumnBorders
            highlightOnHover
            verticalSpacing="sm"
            miw={700}
          >
            <thead>
              <tr>
                <th>Parceiro</th>
                <th>Unidade</th>
                <th>Classificação</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {interacoes.map((interacao) => (
                <tr key={interacao.id}>
                  <td>{interacao.parceiro}</td>
                  <td>{interacao.unidade}</td>
                  <td>{interacao.classificacao}</td>
                  <td>{interacao.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ScrollArea>
      )}
    </SidebarGestor>
  );
}
