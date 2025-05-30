import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Card,
  Title,
  Text,
  Button,
  Modal,
  Group,
  Select,
} from '@mantine/core';
import {
    DragDropContext,
    Droppable,
    Draggable,
  } from '@hello-pangea/dnd';
  import type { DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import SidebarGestor from '../components/SidebarGestor';

interface Oportunidade {
  id: number;
  parceiro: string;
  parceiro_nome: string;
  valor: number;
  observacao: string;
  etapa: string;
  data_criacao: string;
  dias_sem_interacao: number;
}

const etapasKanban = [
  { id: 'oportunidade', titulo: 'Oportunidade', color: 'blue' },
  { id: 'orcamento', titulo: 'Orçamento', color: 'green' },
  { id: 'pedido', titulo: 'Pedido', color: 'yellow' },
  { id: 'perdida', titulo: 'Venda Perdida', color: 'red' },
];

export default function OportunidadesPage() {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [novaEtapa, setNovaEtapa] = useState('');
  const tipoUser = JSON.parse(localStorage.getItem('usuario') || '{}')?.tipo_user;
  const token = localStorage.getItem('token');

  const carregarOportunidades = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/oportunidades/`, { headers });
      setOportunidades(response.data);
    } catch (err) {
      console.error('Erro ao carregar oportunidades:', err);
      setErro('Erro ao carregar oportunidades.');
    } finally {
      setCarregando(false);
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
    carregarOportunidades();
  }, []);

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Title order={2}>Oportunidades (Kanban)</Title>
      </div>

      {carregando ? (
        <Text style={{ textAlign: 'center' }}>Carregando...</Text>
      ) : erro ? (
        <Text style={{ textAlign: 'center', color: 'red' }}>{erro}</Text>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Group align="start" wrap="nowrap">
            {etapasKanban.map((etapa) => (
              <Droppable droppableId={etapa.id} key={etapa.id}>
                {(provided: DroppableProvided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      minWidth: 250,
                      padding: 10,
                      backgroundColor: '#f8f9fa',
                      borderRadius: 8,
                      border: `2px solid ${etapa.color}`,
                      margin: '0 10px',
                    }}
                  >
                    <div style={{ textAlign: 'center', color: etapa.color }}>
                      <Title order={4}>{etapa.titulo}</Title>
                    </div>
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
                              shadow="sm"
                              mt="md"
                            >
                              <Text fw={700}>{o.parceiro_nome}</Text>
                              <Text>Valor: R$ {o.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                              <Text>Sem interação: {o.dias_sem_interacao} dias</Text>
                              <Text size="sm" color="dimmed">{o.observacao}</Text>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </Group>
        </DragDropContext>
      )}

      {/* Modal de movimentação manual */}
      <Modal
        opened={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Mover Oportunidade"
        centered
      >
        <Select
          label="Nova Etapa"
          placeholder="Selecione a etapa"
          value={novaEtapa}
          onChange={(value) => setNovaEtapa(value || '')}
          data={etapasKanban.map((e) => ({ value: e.id, label: e.titulo }))}
        />
        <Group justify="flex-end" mt="md">
          <Button
            onClick={() => {
              if (novaEtapa) {
                // colocar a lógica de movimentação manual aqui
                setModalAberto(false);
              }
            }}
          >
            Mover
          </Button>
        </Group>
      </Modal>
    </SidebarGestor>
  );
}
