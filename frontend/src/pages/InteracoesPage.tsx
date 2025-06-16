import { useEffect, useState, Fragment } from 'react';
import axios from 'axios';
import {
  Table,
  Loader,
  Center,
  Alert,
  Button,
  Group,
  Title,
  Divider,
  Badge,
  Select,
  TextInput,
  Textarea,
  FileButton,
  Drawer,
} from '@mantine/core';
import SidebarGestor from '../components/SidebarGestor';
import styles from './InteracoesPage.module.css';

interface Interacao {
  id: number;
  parceiro: string;
  unidade: string;
  classificacao: string;
  status: string;
  entrou_em_contato?: boolean;
  data_interacao?: string;
  tipo?: string;
  gatilho_extra?: string;
  canal_venda_nome?: string;
  consultor?: string;
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

interface Parceiro {
  id: number;
  parceiro: string;
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

  const [drawerAberto, setDrawerAberto] = useState(false);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [parceiroSelecionado, setParceiroSelecionado] = useState<string | null>(null);
  const [descricaoGatilho, setDescricaoGatilho] = useState('');

  const [canaisVenda, setCanaisVenda] = useState<CanalVenda[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [canalSelecionado, setCanalSelecionado] = useState<string>('');
  const [vendedorSelecionado, setVendedorSelecionado] = useState<string>('');

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const tipoUser = usuario?.tipo_user;
  const token = localStorage.getItem('token');

  const carregarDados = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      if (canalSelecionado) params.append('canal_id', canalSelecionado);
      if (vendedorSelecionado) params.append('consultor', vendedorSelecionado);

      const [resPendentes, resInteragidos, resMeta] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/interacoes/pendentes/?tipo=pendentes&${params.toString()}`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/interacoes/pendentes/?tipo=interagidos&${params.toString()}`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/interacoes/pendentes/metas/`, { headers }),
      ]);

      const canalNome = (id: number) => {
        const canal = usuario.canais_venda?.find((c: any) => c.id === id);
        return canal ? canal.nome : '';
      };

      setPendentes(resPendentes.data.map((p: any) => ({
        ...p,
        canal_venda_nome: canalNome(p.canal_venda_id),
      })));
      setInteragidos(resInteragidos.data.map((p: any) => ({
        ...p,
        canal_venda_nome: canalNome(p.canal_venda_id),
      })));

      setMetaAtual(resMeta.data.interacoes_realizadas);
      setMetaTotal(resMeta.data.meta_diaria);

      if (tipoUser === 'GESTOR') {
        const canais = usuario.canais_venda || [];
        setCanaisVenda(canais.map((c: { id: number; nome: string }) => ({ id: c.id, nome: c.nome })));
      }
    } catch (err) {
      console.error('Erro ao carregar interações:', err);
      setErro('Erro ao carregar interações. Verifique sua conexão ou login.');
    } finally {
      setCarregando(false);
    }
  };

  const handleCanalChange = async (value: string | null) => {
    setCanalSelecionado(value || '');
    setVendedorSelecionado('');
    if (!value) {
      setVendedores([]);
    } else {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/usuarios-por-canal/?canal_id=${value}`, { headers });
        setVendedores(res.data);
      } catch (error) {
        console.error('Erro ao carregar vendedores:', error);
      }
    }
  };

  const handleVendedorChange = (value: string | null) => {
    setVendedorSelecionado(value || '');
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

  const abrirDrawer = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/parceiros-list/`, { headers });
      setParceiros(res.data);
      setDrawerAberto(true);
    } catch (err) {
      console.error('Erro ao carregar parceiros:', err);
      alert('Erro ao carregar parceiros');
    }
  };

  const enviarGatilhoManual = async () => {
    if (!parceiroSelecionado || !descricaoGatilho) {
      alert('Selecione o parceiro e preencha a descrição');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${import.meta.env.VITE_API_URL}/upload-gatilhos/`, {
        parceiro: parceiroSelecionado,
        descricao: descricaoGatilho,
      }, { headers });

      alert('Gatilho criado com sucesso!');
      setDrawerAberto(false);
      setDescricaoGatilho('');
      setParceiroSelecionado(null);
      carregarDados();
    } catch (err) {
      console.error('Erro ao criar gatilho:', err);
      alert('Erro ao criar gatilho');
    }
  };

  useEffect(() => {
    carregarDados();
  }, [canalSelecionado, vendedorSelecionado]);

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <div className={styles.pageContainer}>
        <Center mb="md">
          <Title order={2}>Interações de Parceiros Pendentes</Title>
        </Center>

        <Group justify="space-between" mb="md" style={{ flexWrap: 'wrap' }}>
          <Badge color={metaAtual >= metaTotal ? 'teal' : 'yellow'} size="lg">
            Meta do dia: {metaAtual}/{metaTotal}
          </Badge>
          <Group>
            <Button color="teal" onClick={abrirDrawer}>
              Adicionar Gatilho Manual
            </Button>
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
        </Group>

        {tipoUser === 'GESTOR' && (
          <Group mb="xl" style={{ flexWrap: 'wrap' }}>
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
              onChange={handleVendedorChange}
              data={vendedores.map((v) => ({ value: v.id_vendedor, label: v.username }))}
              disabled={!canalSelecionado}
              clearable
            />
          </Group>
        )}

        {carregando ? (
          <Center><Loader /></Center>
        ) : erro ? (
          <Center><Alert color="red" title="Erro">{erro}</Alert></Center>
        ) : (
          <>
            <Divider label="A Interagir" mb="xs" />
            <div className={styles.tableWrapper}>
              <Table striped highlightOnHover withTableBorder className={styles.table}>
                <thead>
                  <tr>
                    <th>Parceiro</th>
                    <th>Unidade</th>
                    <th>Classificação</th>
                    <th>Status</th>
                    <th>Gatilho Extra</th>
                    <th>Tipo</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {pendentes.map((item) => (
                    <Fragment key={item.id}>
                      <tr className={item.gatilho_extra ? styles.gatilhoRow : ''}>
                        <td>{item.parceiro}</td>
                        <td>{item.unidade}</td>
                        <td>{item.classificacao}</td>
                        <td>{item.status}</td>
                        <td>
                          {item.gatilho_extra ? (
                            <Badge color="red" size="sm" variant="filled" radius="xs">
                              {item.gatilho_extra}
                            </Badge>
                          ) : "-"}
                        </td>
                        <td>
                          <Select
                            placeholder="Tipo"
                            className={styles.select}
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
                        </td>
                        <td>
                          <Button size="xs" className={styles.button} onClick={() => setExpandirId(item.id)}>
                            Marcar como interagido
                          </Button>
                        </td>
                      </tr>
                      {expandirId === item.id && (
                        <tr>
                          <td colSpan={7}>
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
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </Table>
            </div>

            <Divider label="Interagidos Hoje" mt="xl" mb="md" />
            <div className={styles.tableWrapper}>
              <Table striped highlightOnHover withTableBorder className={styles.table}>
                <thead>
                  <tr>
                    <th>Parceiro</th>
                    <th>Unidade</th>
                    <th>Classificação</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {interagidos.map((item) => (
                    <tr key={item.id}>
                      <td>{item.parceiro}</td>
                      <td>{item.unidade}</td>
                      <td>{item.classificacao}</td>
                      <td>{item.status}</td>
                      <td>{item.data_interacao ? new Date(item.data_interacao).toLocaleString() : ''}</td>
                      <td>{item.tipo}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}

        <Drawer opened={drawerAberto} onClose={() => setDrawerAberto(false)} position="right">
          <Drawer.Overlay />
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Adicionar Gatilho Manual</Drawer.Title>
              <Drawer.CloseButton />
            </Drawer.Header>
            <Drawer.Body>
              <div className={styles.drawerContent}>
                <Select
                  label="Parceiro"
                  placeholder="Selecione um parceiro"
                  data={parceiros.map(p => ({ value: String(p.id), label: p.parceiro }))}
                  value={parceiroSelecionado}
                  onChange={setParceiroSelecionado}
                  searchable
                />
                <TextInput
                  label="Descrição"
                  placeholder="Ex: Urgente, Precisa Retorno..."
                  value={descricaoGatilho}
                  onChange={(e) => setDescricaoGatilho(e.currentTarget.value)}
                />
                <Group mt="lg" justify="flex-end">
                  <Button variant="default" onClick={() => setDrawerAberto(false)}>
                    Cancelar
                  </Button>
                  <Button color="blue" onClick={enviarGatilhoManual}>
                    Salvar
                  </Button>
                </Group>
              </div>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      </div>
    </SidebarGestor>
  );
}
