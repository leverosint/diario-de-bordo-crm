import { useEffect, useState } from 'react';
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
  Card,
  Pagination,
  } from '@mantine/core';
import { FixedSizeList as List } from 'react-window';
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

interface Parceiro {
  id: number;
  parceiro: string;
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

export default function InteracoesPage() {
  const itemsPerPage = 7;
  const [pagePend, setPagePend] = useState(1);
  const [pageInter, setPageInter] = useState(1);
  const [pendentes, setPendentes] = useState<Interacao[]>([]);
  const [interagidos, setInteragidos] = useState<Interacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [metaAtual, setMetaAtual] = useState(0);
  const [metaTotal, setMetaTotal] = useState(6);
  const [tipoSelecionado, setTipoSelecionado] = useState<{ [key: number]: string }>({});
  const [expandirId, setExpandirId] = useState<number | null>(null);
  const [valorOportunidade, setValorOportunidade] = useState('');
  const [observacaoOportunidade, setObservacaoOportunidade] = useState('');
  const [mostrarInteracaoManual, setMostrarInteracaoManual] = useState(false);
  const [mostrarGatilhoManual, setMostrarGatilhoManual] = useState(false);
  const [parceiroInteracaoManual, setParceiroInteracaoManual] = useState<string | null>(null);
  const [tipoInteracaoManual, setTipoInteracaoManual] = useState<string | null>(null);
  const [valorInteracaoManual, setValorInteracaoManual] = useState('');
  const [obsInteracaoManual, setObsInteracaoManual] = useState('');
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [parceiroSelecionado, setParceiroSelecionado] = useState<string | null>(null);
  const [descricaoGatilho, setDescricaoGatilho] = useState('');
  const [arquivoGatilho, setArquivoGatilho] = useState<File | null>(null);

  const [parceiroFilter, setParceiroFilter] = useState<string | null>(null);
  const [canalSelecionado, setCanalSelecionado] = useState<string>('');
  const [vendedorSelecionado, setVendedorSelecionado] = useState<string>('');
  const [statusSelecionado, setStatusSelecionado] = useState('');
  const [temGatilho, setTemGatilho] = useState('');
  const [canaisVenda, setCanaisVenda] = useState<CanalVenda[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [statusDisponiveis, setStatusDisponiveis] = useState<string[]>([]);
  const [gatilhosDisponiveis, setGatilhosDisponiveis] = useState<string[]>([]);

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


  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const tipoUser = usuario?.tipo_user;
  const token = localStorage.getItem('token');

  const carregarDados = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resPendentes, resInteragidosHoje, resMeta, resParceiros] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/interacoes/pendentes/`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/interacoes/hoje/`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/interacoes/pendentes/metas/`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/parceiros-list/`, { headers }),
      ]);

      setPendentes(resPendentes.data.dados || []);
      setInteragidos(resInteragidosHoje.data || []);
      setMetaAtual(resMeta.data.interacoes_realizadas);
      setMetaTotal(resMeta.data.meta_diaria);
      setParceiros(resParceiros.data);
      setStatusDisponiveis(resPendentes.data.status_disponiveis || []);
      setGatilhosDisponiveis(resPendentes.data.gatilhos_disponiveis || []);
      if (tipoUser === 'GESTOR' || tipoUser === 'ADMIN') {
        const canais = (usuario.canais_venda || []) as CanalVenda[];
        setCanaisVenda(canais.map(c => ({ id: c.id, nome: c.nome })));
      }
    } catch (err) {
      console.error('Erro ao carregar interações:', err);
      setErro('Erro ao carregar interações.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

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
      alert('Erro ao enviar arquivo de gatilhos. Verifique o formato.');
    }
  };

  const pendentesExibidos = pendentes.slice(
    (pagePend - 1) * itemsPerPage,
    pagePend * itemsPerPage
  );

  const interagidosExibidos = interagidos.slice(
    (pageInter - 1) * itemsPerPage,
    pageInter * itemsPerPage
  );

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <div className={styles.pageContainer}>
        <Center mb="md">
          <Title order={2}>Interações de Parceiros</Title>
        </Center>

        <Group justify="space-between" mb="md">
          <Badge color={metaAtual >= metaTotal ? 'teal' : 'yellow'} size="lg">
            Meta do dia: {metaAtual}/{metaTotal}
          </Badge>
          <Group>
            <Button onClick={() => setMostrarInteracaoManual((v) => !v)}>
              {mostrarInteracaoManual ? 'Fechar Interação Manual' : 'Adicionar Interação Manual'}
            </Button>
            <Button onClick={() => setMostrarGatilhoManual((v) => !v)}>
              {mostrarGatilhoManual ? 'Fechar Gatilho Manual' : 'Adicionar Gatilho Manual'}
            </Button>
          </Group>
        </Group>
        <Divider style={{ marginBottom: 8 }} label="Filtros" />
        
        {(tipoUser === 'GESTOR' || tipoUser === 'ADMIN') && (
  <Group gap="sm" mb="md">
    <FileButton onChange={setArquivoGatilho} accept=".xlsx">
      {(props) => <Button {...props}>Selecionar Arquivo</Button>}
    </FileButton>

    <Button
      color="blue"
      onClick={handleUploadGatilho}
      disabled={!arquivoGatilho}
    >
      Enviar Gatilho
    </Button>
  </Group>
)}


<Group style={{ marginBottom: 16, flexWrap: 'wrap' }}>
  {/* 1) Parceiro: todo mundo vê */}
  <Select
    label="Filtrar por Parceiro"
    placeholder="Selecione um parceiro"
    data={parceiros.map(p => ({ value: String(p.id), label: p.parceiro }))}
    value={parceiroFilter}
    onChange={setParceiroFilter}
    searchable
    clearable
    style={{ minWidth: 200, marginRight: 16 }}
  />

  {/* 2) Canal e Vendedor: só ADMIN ou GESTOR */}
  {(tipoUser === 'ADMIN' || tipoUser === 'GESTOR') && (
    <>
      <Select
        label="Filtrar por Canal"
        placeholder="Selecione um canal"
        data={canaisVenda.map(c => ({ value: String(c.id), label: c.nome }))}
        value={canalSelecionado}
        onChange={handleCanalChange}
        clearable
        style={{ minWidth: 200, marginRight: 16 }}
      />

      <Select
        label="Filtrar por Vendedor"
        placeholder="Selecione um vendedor"
        data={vendedores.map(v => ({ value: v.id_vendedor, label: v.username }))}
        value={vendedorSelecionado}
        onChange={handleVendedorChange}
        disabled={!canalSelecionado}
        clearable
        style={{ minWidth: 200, marginRight: 16 }}
      />
    </>
  )}

  {/* 3) Status: todo mundo vê */}
  <Select
    label="Filtrar por Status"
    placeholder="Selecione um status"
    data={statusDisponiveis.map(s => ({ value: s, label: s }))}
    value={statusSelecionado}
    onChange={(v) => setStatusSelecionado(v || '')}
    clearable
    style={{ minWidth: 200, marginRight: 16 }}
  />

  {/* 4) Gatilho: todo mundo vê */}
  <Select
    label="Filtrar por Gatilho"
    placeholder="Selecione"
    data={gatilhosDisponiveis.map(g => ({ value: g, label: g }))}
    value={temGatilho}
    onChange={(v) => setTemGatilho(v || '')}
    clearable
    style={{ minWidth: 200 }}
  />
</Group>

        {mostrarInteracaoManual && (
          <Card shadow="sm" padding="lg" mb="md">
            <Group grow>
              <Select
                label="Parceiro"
                placeholder="Selecione um parceiro"
                data={parceiros.map(p => ({ value: String(p.id), label: p.parceiro }))}
                value={parceiroInteracaoManual}
                onChange={setParceiroInteracaoManual}
                searchable
              />
              <Select
                label="Tipo de Interação"
                placeholder="Selecione"
                data={[
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'email', label: 'E-mail' },
                  { value: 'ligacao', label: 'Ligação' },
                  { value: 'visita', label: 'Visita Presencial' },
                ]}
                value={tipoInteracaoManual}
                onChange={setTipoInteracaoManual}
              />
              <TextInput
                label="Valor da Oportunidade (R$)"
                placeholder="5000"
                value={valorInteracaoManual}
                onChange={e => setValorInteracaoManual(e.currentTarget.value)}
              />
              <Textarea
                label="Observação"
                placeholder="Detalhes adicionais..."
                value={obsInteracaoManual}
                onChange={e => setObsInteracaoManual(e.currentTarget.value)}
              />
            </Group>
            <Group justify="flex-end" mt="md">
              <Button>Salvar Interação</Button>
            </Group>
          </Card>
        )}

        {mostrarGatilhoManual && (
          <Card shadow="sm" padding="lg" mb="md">
            <Group grow>
              <Select
                label="Parceiro"
                placeholder="Selecione um parceiro"
                data={parceiros.map(p => ({ value: String(p.id), label: p.parceiro }))}
                value={parceiroSelecionado}
                onChange={setParceiroSelecionado}
                searchable
              />
              <TextInput
                label="Descrição do Gatilho"
                placeholder="Ex: Urgente, Precisa Retorno..."
                value={descricaoGatilho}
                onChange={(e) => setDescricaoGatilho(e.currentTarget.value)}
              />
              <FileButton onChange={setArquivoGatilho} accept=".xlsx">
                {(props) => <Button {...props}>Selecionar Arquivo XLSX</Button>}
              </FileButton>
              <Button color="blue" onClick={handleUploadGatilho} disabled={!arquivoGatilho}>
                Enviar Gatilho
              </Button>
            </Group>
          </Card>
        )}

        {carregando ? (
          <Center><Loader /></Center>
        ) : erro ? (
          <Center><Alert color="red" title="Erro">{erro}</Alert></Center>
        ) : (
          <>
            <Divider style={{ marginBottom: 8 }} label="A Interagir" />

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
              </Table>

              <List
                height={600}
                itemCount={pendentesExibidos.length}
                itemSize={expandirId ? 200 : 80}
                width="100%"
              >
                {({ index, style }) => {
                  const item = pendentesExibidos[index];
                  if (!item) return null;

                  return (
                    <div style={style} key={item.id}>
                      <Table striped withTableBorder className={styles.table}>
                        <tbody>
                          <tr>
                            <td>{item.parceiro}</td>
                            <td>{item.unidade}</td>
                            <td>{item.classificacao}</td>
                            <td>{item.status}</td>
                            <td>
                              {item.gatilho_extra
                                ? <Badge color="red" size="sm">{item.gatilho_extra}</Badge>
                                : "-"}
                            </td>
                            <td>
                              <Select
                                placeholder="Tipo"
                                className={styles.select}
                                value={tipoSelecionado[item.id] || ''}
                                onChange={(v) => {
                                  if (v) setTipoSelecionado(prev => ({ ...prev, [item.id]: v }));
                                }}
                                data={[
                                  { value: 'whatsapp', label: 'WhatsApp' },
                                  { value: 'email', label: 'E-mail' },
                                  { value: 'ligacao', label: 'Ligação' },
                                  { value: 'visita', label: 'Visita Presencial' },
                                ]}
                              />
                            </td>
                            <td>
                              <Button size="xs" onClick={() => setExpandirId(item.id)}>
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
                                    onChange={e => setValorOportunidade(e.currentTarget.value)}
                                  />
                                  <Textarea
                                    label="Observação"
                                    placeholder="Detalhes adicionais..."
                                    value={observacaoOportunidade}
                                    onChange={e => setObservacaoOportunidade(e.currentTarget.value)}
                                  />
                                </Group>
                                <Group style={{ marginTop: 16 }} justify="flex-end">
                                  <Button color="blue">Salvar e Criar Oportunidade</Button>
                                  <Button color="gray">Só Interagir</Button>
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
                        </tbody>
                      </Table>
                    </div>
                  );
                }}
              </List>

              <Pagination
                value={pagePend}
                onChange={setPagePend}
                total={Math.ceil(pendentes.length / itemsPerPage)}
                mt="md"
              />
            </div>

            <Divider label="Interagidos Hoje" style={{ marginTop: 32, marginBottom: 16 }} />

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
                  {interagidosExibidos.map((item) => (
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

              <Pagination
                value={pageInter}
                onChange={setPageInter}
                total={Math.ceil(interagidos.length / itemsPerPage)}
                mt="md"
              />
            </div>
          </>
        )}
      </div>
    </SidebarGestor>
  );
}
