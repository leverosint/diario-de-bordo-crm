import { useEffect, useState, Fragment } from 'react';
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
  Grid,
  TextInput,
  Textarea,
  FileButton,
} from '@mantine/core';
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
  gatilho_extra?: string; // 🟢 Nome correto
}

export default function InteracoesPage() {
  const [pendentes, setPendentes] = useState<Interacao[]>([]);
  const [interagidos, setInteragidos] = useState<Interacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [metaAtual, setMetaAtual] = useState(0);
  const [metaTotal, setMetaTotal] = useState(10);
  const [tipoSelecionado, setTipoSelecionado] = useState<{ [key: number]: string }>({});
  const [expandirId, setExpandirId] = useState<number | null>(null);
  const [valorOportunidade, setValorOportunidade] = useState('');
  const [observacaoOportunidade, setObservacaoOportunidade] = useState('');
  const [arquivoGatilho, setArquivoGatilho] = useState<File | null>(null);

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const tipoUser = usuario?.tipo_user;
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

  const registrarInteracao = async (
    parceiroId: number,
    tipo: string,
    oportunidade: boolean,
    valor?: number,
    observacao?: string
  ) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(`${import.meta.env.VITE_API_URL}/interacoes/registrar/`, {
        parceiro: parceiroId,
        tipo,
        entrou_em_contato: true,
      }, { headers });

      if (oportunidade && valor) {
        await axios.post(`${import.meta.env.VITE_API_URL}/oportunidades/`, {
          parceiro: parceiroId,
          valor: valor,
          observacao: observacao,
          etapa: 'oportunidade',
        }, { headers });
      }

      setExpandirId(null);
      setValorOportunidade('');
      setObservacaoOportunidade('');
      await carregarDados();
    } catch (err) {
      console.error('Erro ao registrar interação ou oportunidade:', err);
      alert('Erro ao registrar interação ou oportunidade. Tente novamente.');
    }
  };

  const handleUploadGatilho = async () => {
    if (!arquivoGatilho) return alert('Selecione um arquivo antes de enviar.');
    const formData = new FormData();
    formData.append('file', arquivoGatilho);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${import.meta.env.VITE_API_URL}/upload-gatilhos/`, formData, { headers });
      alert('Gatilhos extras enviados com sucesso!');
      setArquivoGatilho(null);
      carregarDados();
    } catch (err) {
      console.error('Erro ao enviar arquivo de gatilhos extras:', err);
      alert('Erro ao enviar arquivo de gatilhos extras. Verifique o formato.');
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
        {tipoUser === 'GESTOR' && (
          <Group>
            <FileButton onChange={setArquivoGatilho} accept=".xlsx">
              {(props) => <Button {...props}>Selecionar Arquivo de Gatilho</Button>}
            </FileButton>
            <Button
              color="blue"
              onClick={handleUploadGatilho}
              disabled={!arquivoGatilho}
            >
              Enviar Gatilhos Extras
            </Button>
          </Group>
        )}
      </Group>

      {carregando ? (
        <Center><Loader /></Center>
      ) : erro ? (
        <Center><Alert color="red" title="Erro">{erro}</Alert></Center>
      ) : (
        <>
          <Grid>
            <Grid.Col span={6}>
              <Divider label="A Interagir" mb="xs" />
              {pendentes.length === 0 ? (
                <Text>Nenhuma interação pendente encontrada.</Text>
              ) : (
                <ScrollArea h={400}>
                  <Table striped highlightOnHover withTableBorder>
                    <TableThead>
                      <TableTr>
                        <TableTh>Parceiro</TableTh>
                        <TableTh>Unidade</TableTh>
                        <TableTh>Classificação</TableTh>
                        <TableTh>Status</TableTh>
                        <TableTh>Gatilho Extra</TableTh>
                        <TableTh>Tipo</TableTh>
                        <TableTh>Ação</TableTh>
                      </TableTr>
                    </TableThead>
                    <TableTbody>
                      {pendentes.map((item) => (
                        <Fragment key={item.id}>
                          <TableTr style={item.gatilho_extra ? { backgroundColor: '#ffe5e5' } : {}}>
                            <TableTd>{item.parceiro}</TableTd>
                            <TableTd>{item.unidade}</TableTd>
                            <TableTd>{item.classificacao}</TableTd>
                            <TableTd>{item.status}</TableTd>
                            <TableTd>
                              {item.gatilho_extra ? (
                                <Badge color="red" variant="filled">{item.gatilho_extra}</Badge>
                              ) : (
                                "-"
                              )}
                            </TableTd>
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
                              <Button size="xs" onClick={() => setExpandirId(item.id)}>
                                Marcar como interagido
                              </Button>
                            </TableTd>
                          </TableTr>
                          {expandirId === item.id && (
                            <TableTr>
                              <TableTd colSpan={7}>
                                <Group grow style={{ marginTop: 10 }}>
                                  <TextInput
                                    label="Valor da Oportunidade (R$)"
                                    placeholder="5000"
                                    value={valorOportunidade}
                                    onChange={(e) => setValorOportunidade(e.currentTarget.value)}
                                  />
                                  <Textarea
                                    label="Observação"
                                    placeholder="Detalhes adicionais..."
                                    value={observacaoOportunidade}
                                    onChange={(e) => setObservacaoOportunidade(e.currentTarget.value)}
                                  />
                                </Group>
                                <Group mt="md" justify="flex-end">
                                  <Button
                                    color="blue"
                                    onClick={() => registrarInteracao(
                                      item.id,
                                      tipoSelecionado[item.id] || '',
                                      true,
                                      parseFloat(valorOportunidade.replace(',', '.')),
                                      observacaoOportunidade
                                    )}
                                  >
                                    Salvar e Criar Oportunidade
                                  </Button>
                                  <Button
                                    color="gray"
                                    onClick={() => registrarInteracao(item.id, tipoSelecionado[item.id] || '', false)}
                                  >
                                    Só Interagir
                                  </Button>
                                  <Button
                                    color="red"
                                    variant="outline"
                                    onClick={() => {
                                      setExpandirId(null);
                                      setValorOportunidade('');
                                      setObservacaoOportunidade('');
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                </Group>
                              </TableTd>
                            </TableTr>
                          )}
                        </Fragment>
                      ))}
                    </TableTbody>
                  </Table>
                </ScrollArea>
              )}
            </Grid.Col>

            <Grid.Col span={6}>
              <Divider label="Interagidos Hoje" mb="xs" />
              {interagidos.length === 0 ? (
                <Text>Nenhum parceiro interagido hoje.</Text>
              ) : (
                <ScrollArea h={400}>
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
            </Grid.Col>
          </Grid>

          <Divider label="Oportunidades (Kanban)" mt="xl" mb="md" />
          <OportunidadesKanban />
        </>
      )}
    </SidebarGestor>
  );
}
