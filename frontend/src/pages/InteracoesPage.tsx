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
  Card,
  Pagination,
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
 
    // 2) Defina quantos itens por página e o estado de página atual
  const itemsPerPage = 10;              // ← quantos itens exibir em cada página
  const [pagePend, setPagePend] = useState(1);     // ← página atual de “A Interagir”
  const [pageInter, setPageInter] = useState(1);   // ← página atual de “Interagidos Hoje”
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
  const [arquivoGatilho, setArquivoGatilho] = useState<File | null>(null);
  const [statusSelecionado, setStatusSelecionado] = useState('');
  const [temGatilho, setTemGatilho] = useState('');
  const [statusDisponiveis, setStatusDisponiveis] = useState<string[]>([]);
  const [gatilhosDisponiveis, setGatilhosDisponiveis] = useState<string[]>([]);
  // logo abaixo dos outros useState(...)
  const [mostrarInteracaoManual, setMostrarInteracaoManual] = useState(false);
  const [parceiroInteracaoManual, setParceiroInteracaoManual] = useState<string | null>(null);
  const [tipoInteracaoManual, setTipoInteracaoManual] = useState<string | null>(null);
  const [valorInteracaoManual, setValorInteracaoManual] = useState<string>('');
  const [obsInteracaoManual, setObsInteracaoManual] = useState('');
  const [parceiroFilter, setParceiroFilter] = useState<string | null>(null);





  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [parceiroSelecionado, setParceiroSelecionado] = useState<string | null>(null);
  const [descricaoGatilho, setDescricaoGatilho] = useState('');
  const [mostrarGatilhoManual, setMostrarGatilhoManual] = useState(false);

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
      if (parceiroFilter)     params.append('parceiro', parceiroFilter);
      if (canalSelecionado)   params.append('canal_id', canalSelecionado);
      if (vendedorSelecionado) params.append('consultor', vendedorSelecionado);
      if (statusSelecionado)   params.append('status', statusSelecionado);
      if (temGatilho)          params.append('gatilho_extra', temGatilho);
   
  
      const canalNome = (id: number) => {
        const canais = (usuario.canais_venda || []) as CanalVenda[];
        const canal = canais.find((c: CanalVenda) => c.id === id); // Tipado aqui!
        return canal ? canal.nome : '';
      };
  
      const [
        resPendentes,
        resInteragidosHoje,
        resMeta,
        resParceiros,
      ] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_API_URL}/interacoes/pendentes/?tipo=pendentes&${params.toString()}`,
          { headers }
        ),
        axios.get(
          `${import.meta.env.VITE_API_URL}/interacoes/hoje/`,
          { headers }
        ),
        axios.get(
          `${import.meta.env.VITE_API_URL}/interacoes/pendentes/metas/`,
          { headers }
        ),
        axios.get(
          `${import.meta.env.VITE_API_URL}/parceiros-list/`,
          { headers }
        ),
      ]);
  
      // A Interagir
      setPendentes(
        resPendentes.data.dados.map((p: any) => ({
          ...p,
          canal_venda_nome: canalNome(p.canal_venda_id),
        }))
      );
  
      // Interagidos Hoje-
      setInteragidos(
        resInteragidosHoje.data.map((i: any) => ({
          id:               i.id,
          parceiro:         i.parceiro,    // ✅ antes era i.parceiro_nome (não existe)
          unidade:          i.unidade,
          classificacao:    i.classificacao,
          status:           i.status,
          data_interacao:   i.data_interacao,
          tipo:             i.tipo,
          gatilho_extra:    i.gatilho_extra,
          canal_venda_nome: canalNome(i.canal_venda_id),
        }))
      );
  
      // Filtros e metas
      setStatusDisponiveis(resPendentes.data.status_disponiveis);
      setGatilhosDisponiveis(resPendentes.data.gatilhos_disponiveis);
      setMetaAtual(resMeta.data.interacoes_realizadas);
      setMetaTotal(resMeta.data.meta_diaria);
      setParceiros(resParceiros.data);
  
      if (tipoUser === 'GESTOR') {
        const canais = (usuario.canais_venda || []) as CanalVenda[];
        setCanaisVenda(canais.map((c: CanalVenda) => ({ id: c.id, nome: c.nome })));
  
      
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

  const salvarGatilhoManual = async () => {
    if (!parceiroSelecionado || !descricaoGatilho) {
      alert('Selecione o parceiro e preencha a descrição');
      return;
    }
  
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${import.meta.env.VITE_API_URL}/criar-gatilho-manual/`, {
        parceiro: parceiroSelecionado,  // 👈 Nome correto
        usuario: usuario.id,             // 👈 Usuário logado
        descricao: descricaoGatilho,
      }, { headers });
  
      alert('Gatilho manual criado com sucesso!');
      setDescricaoGatilho('');
      setParceiroSelecionado(null);
      setMostrarGatilhoManual(false);
      carregarDados();
    } catch (err) {
      console.error('Erro ao criar gatilho manual:', err);
      alert('Erro ao criar gatilho manual');
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
  
      // 👉 Pega o parceiro atual
      const parceiro = pendentes.find(p => p.id === parceiroId);
  
      // 👉 Extrai o gatilho_extra desse parceiro
      const gatilhoExtra = parceiro?.gatilho_extra || null;
  
      if (oportunidade) {
        // 🔥 Se for gerar oportunidade
        await axios.post(`${import.meta.env.VITE_API_URL}/oportunidades/registrar/`, {
          parceiro: parceiroId,
          tipo,
          valor,
          observacao,
          gatilho_extra: gatilhoExtra, // 🔥 Envia o gatilho_extra
        }, { headers });
      } else {
        // ✅ Só interação
        await axios.post(`${import.meta.env.VITE_API_URL}/interacoes/registrar/`, {
          parceiro: parceiroId,
          tipo,
          observacao,
          gatilho_extra: gatilhoExtra, // 🔥 Envia o gatilho_extra
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
    if (!tipo) {
      alert('Selecione o tipo de interação');
      return;
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
  }, [canalSelecionado, vendedorSelecionado, parceiroFilter, statusSelecionado, temGatilho]);
  
  
  // 3) Calcule quais itens aparecem em cada tabela, conforme a página atual
 // 3a) primeiro, aplique o filtro de parceiro—se parceiroFilter estiver setado
 const pendentesFiltrados = pendentes
  .filter(item => !parceiroFilter || String(item.id) === parceiroFilter)
 

const interagidosFiltrados = interagidos
  .filter(item => !parceiroFilter || String(item.id) === parceiroFilter)

// 3b) agora sim, pagine sobre o array já filtrado
const pendentesExibidos = pendentesFiltrados.slice(
(pagePend - 1) * itemsPerPage,
pagePend * itemsPerPage
);
const interagidosExibidos = interagidosFiltrados.slice(
(pageInter - 1) * itemsPerPage,
pageInter * itemsPerPage
);


  return (
    <SidebarGestor tipoUser={tipoUser}>
      <div className={styles.pageContainer}>
        <Center mb="md">
          <Title order={2}>Interações de Parceiros Pendentes</Title>
        </Center>

        <Group justify="space-between" mb="md">
  <Badge color={metaAtual >= metaTotal ? 'teal' : 'yellow'} size="lg">
    Meta do dia: {metaAtual}/{metaTotal}
  </Badge>

  {/* Para ADMIN e GESTOR: importar gatilhos e gatilho manual */}
  {(tipoUser === 'ADMIN' || tipoUser === 'GESTOR') && (
    <Group gap="sm">
      <FileButton onChange={setArquivoGatilho} accept=".xlsx">
        {(props) => <Button {...props}>Selecionar Arquivo de Gatilho</Button>}
      </FileButton>

      <Button
        color="blue"
        onClick={handleUploadGatilho}
        disabled={!arquivoGatilho}
      >
        Enviar Gatilhos
      </Button>

      <Button
        color={mostrarGatilhoManual ? 'red' : 'teal'}
        variant={mostrarGatilhoManual ? 'outline' : 'filled'}
        onClick={() => setMostrarGatilhoManual((o) => !o)}
      >
        {mostrarGatilhoManual ? 'Fechar Gatilho Manual' : 'Adicionar Gatilho Manual'}
      </Button>
    </Group>
  )}

  {/* Para TODOS (ADMIN, GESTOR e VENDEDOR): interação manual */}
  {(tipoUser === 'ADMIN' || tipoUser === 'GESTOR' || tipoUser === 'VENDEDOR') && (
    <Group gap="sm">
      <Button
        variant="filled"
        styles={{
          root: {
            backgroundColor: '#005A64',
            '&:hover': { backgroundColor: '#004F57' },
          },
        }}
        onClick={() => setMostrarInteracaoManual((o) => !o)}
      >
        {mostrarInteracaoManual
          ? 'Fechar Interação Manual'
          : 'Adicionar Interação Manual'}
      </Button>
    </Group>
  )}
</Group>




{mostrarInteracaoManual && (
  <Card shadow="sm" padding="lg" mb="md">
    <Group grow>
      {/* Seleção de parceiro */}
      <Select
        label="Parceiro"
        placeholder="Selecione um parceiro"
        data={parceiros.map(p => ({ value: String(p.id), label: p.parceiro }))}
        value={parceiroInteracaoManual}
        onChange={setParceiroInteracaoManual}
        searchable
        required
      />

      {/* Tipo de interação */}
      <Select
        label="Tipo de Interação"
        placeholder="Selecione"
        data={[
          { value: 'whatsapp', label: 'WhatsApp' },
          { value: 'email',    label: 'E-mail' },
          { value: 'ligacao',  label: 'Ligação' },
          { value: 'visita',  label: 'Visita Presencial' },
        ]}
        value={tipoInteracaoManual}
        onChange={setTipoInteracaoManual}
        required
      />

      {/* Valor da oportunidade */}
      <TextInput
        label="Valor da Oportunidade (R$)"
        placeholder="5000"
        value={valorInteracaoManual}
        onChange={e => setValorInteracaoManual(e.currentTarget.value)}
      />

      {/* Observação */}
      <Textarea
        label="Observação"
        placeholder="Detalhes adicionais..."
        value={obsInteracaoManual}
        onChange={e => setObsInteracaoManual(e.currentTarget.value)}
        autosize
        minRows={2}
      />
    </Group>

    <Group justify="flex-end" mt="md">
    <Button
  variant="outline"
  onClick={async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/interacoes/registrar/`,
        { parceiro: parceiroInteracaoManual, tipo: tipoInteracaoManual, observacao: obsInteracaoManual },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // 1) Primeiro recarrega dados...
      await carregarDados();
      // 2) Só então fecha o formulário
      setMostrarInteracaoManual(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar interação.');
    }
  }}
>
  Só Interagir
</Button>


<Button
  onClick={async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/oportunidades/registrar/`,
        {
          parceiro: parceiroInteracaoManual,
          tipo: tipoInteracaoManual,
          valor: parseFloat(valorInteracaoManual.replace(',', '.')),
          observacao: obsInteracaoManual,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await carregarDados();
      setMostrarInteracaoManual(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar oportunidade.');
    }
  }}
>
  Salvar e Criar Oportunidade
</Button>

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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescricaoGatilho(e.currentTarget.value)}

              />
              <Button color="blue" onClick={salvarGatilhoManual}>
                Salvar Gatilho Manual
              </Button>
            </Group>
          </Card>
        )}


 

{/* === FILTROS === */}
<Divider style={{ marginBottom: 8 }} label="Filtros" />

<Group style={{ marginBottom: 16, flexWrap: 'wrap' }}>
  {/* 1) Parceiro: todo mundo vê */}
  <Select
    label="Filtrar por Parceiro"
    placeholder="Selecione um parceiro"
    value={parceiroFilter}
    onChange={setParceiroFilter}
    data={parceiros.map(p => ({ value: String(p.id), label: p.parceiro }))}
    searchable
    clearable
    style={{ minWidth: 200, marginRight: 16 }}
  />

  {/* 2) Canal / Vendedor: só ADMIN ou GESTOR */}
  {(tipoUser === 'ADMIN' || tipoUser === 'GESTOR') && (
    <>
      <Select
        label="Filtrar por Canal"
        placeholder="Selecione um canal"
        value={canalSelecionado}
        onChange={handleCanalChange}
        data={canaisVenda.map(c => ({ value: String(c.id), label: c.nome }))}
        clearable
        style={{ minWidth: 200, marginRight: 16 }}
      />
       

      <Select
        label="Filtrar por Vendedor"
        placeholder="Selecione um vendedor"
        value={vendedorSelecionado}
        onChange={handleVendedorChange}
        data={vendedores.map(v => ({ value: v.id_vendedor, label: v.username }))}
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
    value={statusSelecionado}
    onChange={v => setStatusSelecionado(v || '')}
    data={statusDisponiveis.map(s => ({ value: s, label: s }))}
    clearable
    style={{ minWidth: 200, marginRight: 16 }}
  />

  {/* 4) Gatilho: todo mundo vê */}
  <Select
    label="Filtrar por Gatilho"
    placeholder="Selecione"
    value={temGatilho}
    onChange={v => setTemGatilho(v || '')}
    data={gatilhosDisponiveis.map(g => ({ value: g, label: g }))}
    clearable
    style={{ minWidth: 200 }}
  />
</Group>




{carregando ? (
  <Center><Loader /></Center>
) : erro ? (
  <Center><Alert color="red" title="Erro">{erro}</Alert></Center>
) : (
  <>
    {/* === Tabela “A Interagir” === */}
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
        <tbody>
          {pendentesExibidos.map((item) => (
            <Fragment key={item.id}>
              <tr className={item.gatilho_extra ? styles.gatilhoRow : ''}>
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
                      { value: 'email',    label: 'E-mail' },
                      { value: 'ligacao',  label: 'Ligação' },
                      { value: 'visita',  label: 'Visita Presencial' },
                    ]}
                    clearable={false}
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
                        onClick={() => registrarInteracao(
                          item.id,
                          tipoSelecionado[item.id] || '',
                          false
                        )}
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

      {/* Paginação de  “A Interagir” */}
      <Pagination
  value={pagePend}
  onChange={setPagePend}
  // usa o tamanho do array filtrado
  total={Math.ceil(pendentesFiltrados.length / itemsPerPage)}
  mt="md"
/>
    </div>

    {/* === Tabela “Interagidos Hoje” === */}
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

      {/* Paginação “Interagidos Hoje” */}
      <Pagination
  value={pageInter}
  onChange={setPageInter}
  total={Math.ceil(interagidosFiltrados.length / itemsPerPage)}
  mt="md"
/>
    </div>
  </>
)}  {/* fecha o ternário carregando/erro/conteúdo */}
      </div>
    </SidebarGestor>
  );
}
