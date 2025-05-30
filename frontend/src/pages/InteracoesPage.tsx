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
  Select,
  Modal,
  TextInput,
  Textarea,
  Grid,
} from '@mantine/core';
const { Col } = Grid;
import SidebarGestor from '../components/SidebarGestor';
import OportunidadesKanban from './OportunidadesPage';

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
  const [tipoSelecionado, setTipoSelecionado] = useState<{ [key: number]: string }>({});
  const [parceiroSelecionado, setParceiroSelecionado] = useState<Interacao | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalOportunidadeAberto, setModalOportunidadeAberto] = useState(false);
  const [valorOportunidade, setValorOportunidade] = useState('');
  const [observacaoOportunidade, setObservacaoOportunidade] = useState('');
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

  const handleMarcarInteragido = (parceiro: Interacao) => {
    setParceiroSelecionado(parceiro);
    setModalAberto(true);
  };

  const handleRespostaOportunidade = async (teveOportunidade: boolean) => {
    setModalAberto(false);
    if (teveOportunidade) {
      setModalOportunidadeAberto(true);
    } else {
      await registrarInteracao(parceiroSelecionado?.id!, tipoSelecionado[parceiroSelecionado?.id!] || '', false);
    }
  };

  const handleSalvarOportunidade = async () => {
    if (!valorOportunidade) {
      alert('Por favor, preencha o valor da oportunidade.');
      return;
    }

    try {
      await registrarInteracao(
        parceiroSelecionado?.id!,
        tipoSelecionado[parceiroSelecionado?.id!] || '',
        true,
        parseFloat(valorOportunidade.replace(',', '.')),
        observacaoOportunidade
      );
    } catch (error) {
      console.error('Erro ao registrar oportunidade:', error);
    } finally {
      setModalOportunidadeAberto(false);
      setValorOportunidade('');
      setObservacaoOportunidade('');
    }
  };

  const registrarInteracao = async (
    parceiroId: number,
    tipo: string,
    oportunidade: boolean,
    valor?: number,
    observacao?: string
  ) => {
    try {
      const data = {
        parceiro: parceiroId,
        tipo,
        entrou_em_contato: true,
        oportunidade,
        valor_oportunidade: valor,
        observacao,
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/interacoes/registrar/`, data, {
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

      <Group justify="space-between" mb="md">
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
          <Grid>
            {/* Coluna de Pendentes */}
            <Col span={6}>
              <Divider label="A Interagir" mb="xs" />
              {pendentes.length === 0 ? (
                <Text>Nenhuma interação pendente encontrada.</Text>
              ) : (
                <ScrollArea h={300}>
                  <Table striped highlightOnHover withTableBorder>
                    <TableThead>
                      <TableTr>
                        <TableTh>Parceiro</TableTh>
                        <TableTh>Unidade</TableTh>
                        <TableTh>Classificação</TableTh>
                        <TableTh>Status</TableTh>
                        <TableTh>Tipo</TableTh>
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
                            <Select
                              placeholder="Tipo"
                              value={tipoSelecionado[item.id] || ''}
                              onChange={(value) => {
                                if (value) {
                                  setTipoSelecionado((prev) => ({ ...prev, [item.id]: value }));
                                }
                              }}
                              data={[
                                { value: 'whatsapp', label: 'WhatsApp' },
                                { value: 'email', label: 'E-mail' },
                                { value: 'ligacao', label: 'Ligação' },
                              ]}
                            />
                          </TableTd>
                          <TableTd>
                            <Button size="xs" onClick={() => handleMarcarInteragido(item)}>
                              Marcar como interagido
                            </Button>
                          </TableTd>
                        </TableTr>
                      ))}
                    </TableTbody>
                  </Table>
                </ScrollArea>
              )}
            </Col>

            {/* Coluna de Interagidos */}
            <Col span={6}>
              <Divider label="Interagidos Hoje" mb="xs" />
              {interagidos.length === 0 ? (
                <Text>Nenhum parceiro interagido hoje.</Text>
              ) : (
                <ScrollArea h={300}>
                  <Table striped highlightOnHover withTableBorder>
                    <TableThead>
                      <TableTr>
                        <TableTh>Parceiro</TableTh>
                        <TableTh>Unidade</TableTh>
                        <TableTh>Classificação</TableTh>
                        <TableTh>Status</TableTh>
                        <TableTh>Data</TableTh>
                        <TableTh>Tipo</TableTh>
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
                          <TableTd>{item.tipo}</TableTd>
                        </TableTr>
                      ))}
                    </TableTbody>
                  </Table>
                </ScrollArea>
              )}
            </Col>
          </Grid>

          {/* Kanban Oportunidades */}
          <Divider label="Oportunidades (Kanban)" mt="xl" mb="md" />
          <OportunidadesKanban />
        </>
      )}

      {/* Modal Pergunta Oportunidade */}
      <Modal
        opened={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Teve oportunidade?"
        centered
      >
        <Group justify="center" mt="md">
          <Button onClick={() => handleRespostaOportunidade(true)} color="blue">
            Sim
          </Button>
          <Button onClick={() => handleRespostaOportunidade(false)} color="gray">
            Não
          </Button>
        </Group>
      </Modal>

      {/* Modal Informar Valor e Observação */}
      <Modal
        opened={modalOportunidadeAberto}
        onClose={() => setModalOportunidadeAberto(false)}
        title="Detalhes da Oportunidade"
        centered
      >
        <TextInput
          label="Valor da Oportunidade (R$)"
          placeholder="Ex: 5000"
          value={valorOportunidade}
          onChange={(e) => setValorOportunidade(e.currentTarget.value)}
          mt="md"
        />
        <Textarea
          label="Observação"
          placeholder="Detalhes adicionais..."
          value={observacaoOportunidade}
          onChange={(e) => setObservacaoOportunidade(e.currentTarget.value)}
          mt="md"
        />
        <Group justify="end" mt="md">
          <Button onClick={handleSalvarOportunidade}>Salvar</Button>
        </Group>
      </Modal>
    </SidebarGestor>
  );
}
