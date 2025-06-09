import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Card,
  Title,
  Text,
  Group,
  Select,
  Center,
  Container,
} from '@mantine/core';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';
import type { DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';

import SidebarGestor from '../components/SidebarGestor';
import styles from './OportunidadesPage.module.css'; // Importa o CSS

interface Oportunidade {
  id: number;
  parceiro_nome: string;
  valor: number;
  observacao: string;
  etapa: string;
  dias_sem_interacao: number;
}

interface CanalVenda {
  id: number;
  nome: string;
}

interface Vendedor {
  id: number;
  username: string;
  id_vendedor: string;
}

const etapasKanban = [
  { id: 'oportunidade', titulo: 'Oportunidade', color: '#228be6' },
  { id: 'orcamento', titulo: 'Orçamento', color: '#40c057' },
  { id: 'pedido', titulo: 'Pedido', color: '#fab005' },
  { id: 'perdida', titulo: 'Venda Perdida', color: '#fa5252' },
];

export default function OportunidadesPage() {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [canalSelecionado, setCanalSelecionado] = useState<string>('');
  const [vendedorSelecionado, setVendedorSelecionado] = useState<string>('');
  const [canaisVenda, setCanaisVenda] = useState<CanalVenda[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const tipoUser = usuario?.tipo_user;
  const token = localStorage.getItem('token');

  const carregarOportunidades = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const params = new URLSearchParams();
      if (canalSelecionado) params.append('canal_id', canalSelecionado);
      if (vendedorSelecionado) params.append('consultor', vendedorSelecionado);

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/oportunidades/?${params.toString()}`, { headers });
      setOportunidades(response.data);
    } catch (err) {
      console.error('Erro ao carregar oportunidades:', err);
      setErro('Erro ao carregar oportunidades.');
    } finally {
      setCarregando(false);
    }
  };

  const carregarCanaisVendedores = () => {
    if (tipoUser === 'GESTOR') {
      const canais = usuario.canais_venda || [];
      setCanaisVenda(canais.map((c: { id: number; nome: string }) => ({ id: c.id, nome: c.nome })));
    }
  };

  const handleCanalChange = async (value: string | null) => {
    setCanalSelecionado(value || '');
    setVendedorSelecionado('');
    if (!value) {
      setVendedores([]);
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/usuarios-por-canal/?canal_id=${value}`, { headers });
      setVendedores(res.data);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
    }
  };

  const moverOportunidade = async (id: number, novaEtapa: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.patch(`${import.meta.env.VITE_API_URL}/oportunidades/${id}/`, { etapa: novaEtapa }, { headers });
      await carregarOportunidades();
    } catch (err) {
      console.error('Erro ao mover oportunidade:', err);
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const oportunidadeId = parseInt(result.draggableId);
    const novaEtapa = result.destination.droppableId;
    moverOportunidade(oportunidadeId, novaEtapa);
  };

  useEffect(() => {
    carregarCanaisVendedores();
    carregarOportunidades();
  }, [canalSelecionado, vendedorSelecionado]);

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <div className={styles.pageContainer}>
        {/* Container para centralizar Título e Filtros */}
        <Container size="lg">
          <Center mb="md">
            <Title order={2}>Oportunidades (Kanban)</Title>
          </Center>

          {tipoUser === 'GESTOR' && (
            <Group mb="xl" justify="center">
              <Select
                label="Filtrar por Canal de Venda"
                placeholder="Selecione um canal"
                value={canalSelecionado}
                onChange={handleCanalChange}
                data={canaisVenda.map((c) => ({ value: String(c.id), label: c.nome }))}
                clearable
              />
              <Select
                label="Filtrar por Vendedor"
                placeholder="Selecione um vendedor"
                value={vendedorSelecionado}
                onChange={(value) => setVendedorSelecionado(value || '')}
                data={vendedores.map((v) => ({ value: v.id_vendedor, label: v.username }))}
                disabled={!canalSelecionado}
                clearable
              />
            </Group>
          )}
        </Container>

        {/* Kanban ocupando toda a tela */}
        {carregando ? (
          <Center>
            <Text>Carregando...</Text>
          </Center>
        ) : erro ? (
          <Center>
            <Text color="red">{erro}</Text>
          </Center>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className={styles.kanbanBoard}>
              {etapasKanban.map((etapa) => (
                <Droppable droppableId={etapa.id} key={etapa.id}>
                  {(provided: DroppableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={styles.kanbanColumn}
                      style={{ borderColor: etapa.color }}
                    >
                      <div className={styles.kanbanTitle} style={{ color: etapa.color }}>
                        {etapa.titulo} ({oportunidades.filter((o) => o.etapa === etapa.id).length})
                      </div>
                      <div className={styles.kanbanCards}>
                        {oportunidades
                          .filter((o) => o.etapa === etapa.id)
                          .sort((a, b) => b.dias_sem_interacao - a.dias_sem_interacao)
                          .map((o, index) => (
                            <Draggable draggableId={o.id.toString()} index={index} key={o.id}>
                              {(provided: DraggableProvided) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  withBorder
                                  shadow="md"
                                  radius="md"
                                  p="md"
                                  className={styles.cardItem}
                                >
                                  <Text fw={700} size="md">{o.parceiro_nome}</Text>
                                  <Text size="sm" color="gray">
                                    Valor: R$ {o.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </Text>
                                  <Text size="xs" color="dimmed" mt={5}>
                                    Sem interação: {o.dias_sem_interacao} dias
                                  </Text>
                                  {o.observacao && (
                                    <Text size="xs" mt={5} color="gray">
                                      {o.observacao}
                                    </Text>
                                  )}
                                </Card>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>
    </SidebarGestor>
  );
}
