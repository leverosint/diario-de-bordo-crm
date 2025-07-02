import { useEffect, useState, Fragment, useCallback, useMemo } from 'react';
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

// Hook de debounce para otimizar filtros
const useDebounce = (value: any, delay: number): any => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Função de retry para requisições
const retryRequest = async <T,>(fn: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      console.warn(`Tentativa ${i + 1} falhou, tentando novamente em ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error('Todas as tentativas falharam');
};

// Interfaces
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

interface DadosState {
  pendentes: Interacao[];
  interagidos: Interacao[];
  parceiros: Parceiro[];
  canaisVenda: CanalVenda[];
  vendedores: Vendedor[];
  statusDisponiveis: string[];
  gatilhosDisponiveis: string[];
}

interface PaginacaoState {
  pendentes: number;
  interagidos: number;
}

interface FiltrosState {
  parceiro: string | null;
  canal: string;
  vendedor: string;
  status: string;
  gatilho: string;
}

interface LoadingStatesType {
  dados: boolean;
  interacao: boolean;
  gatilho: boolean;
  upload: boolean;
}

interface FormulariosState {
  mostrarInteracaoManual: boolean;
  mostrarGatilhoManual: boolean;
  parceiroInteracaoManual: string | null;
  tipoInteracaoManual: string | null;
  valorInteracaoManual: string;
  obsInteracaoManual: string;
  parceiroSelecionado: string | null;
  descricaoGatilho: string;
}

interface InteracaoState {
  tipoSelecionado: Record<number, string>;
  expandirId: number | null;
  valorOportunidade: string;
  observacaoOportunidade: string;
  arquivoGatilho: File | null;
}

interface MetaState {
  atual: number;
  total: number;
}

// Interface para o retorno de dadosProcessados
interface DadosProcessados {
  pendentesExibidos: Interacao[];
  interagidosExibidos: Interacao[];
  totalInteragidos: number;
}

export default function InteracoesPage() {
  const itemsPerPage = 10;
  
  // Estados consolidados
  const [dados, setDados] = useState<DadosState>({
    pendentes: [],
    interagidos: [],
    parceiros: [],
    canaisVenda: [],
    vendedores: [],
    statusDisponiveis: [],
    gatilhosDisponiveis: []
  });

  const [paginacao, setPaginacao] = useState<PaginacaoState>({
    pendentes: 1,
    interagidos: 1
  });

  const [filtros, setFiltros] = useState<FiltrosState>({
    parceiro: null,
    canal: '',
    vendedor: '',
    status: '',
    gatilho: ''
  });

  const [loadingStates, setLoadingStates] = useState<LoadingStatesType>({
    dados: false,
    interacao: false,
    gatilho: false,
    upload: false
  });

  const [formularios, setFormularios] = useState<FormulariosState>({
    mostrarInteracaoManual: false,
    mostrarGatilhoManual: false,
    parceiroInteracaoManual: null,
    tipoInteracaoManual: null,
    valorInteracaoManual: '',
    obsInteracaoManual: '',
    parceiroSelecionado: null,
    descricaoGatilho: ''
  });

  const [interacao, setInteracao] = useState<InteracaoState>({
    tipoSelecionado: {},
    expandirId: null,
    valorOportunidade: '',
    observacaoOportunidade: '',
    arquivoGatilho: null
  });

  const [meta, setMeta] = useState<MetaState>({
    atual: 0,
    total: 6
  });

  const [totalPendentes, setTotalPendentes] = useState<number>(0);
  const [erro, setErro] = useState<string | null>(null);

  // Debounce para filtros
  const debouncedFiltros = {
    parceiro: useDebounce(filtros.parceiro, 500),
    status: useDebounce(filtros.status, 500),
    gatilho: useDebounce(filtros.gatilho, 500)
  };

  // Dados do usuário memoizados
  const usuario = useMemo(() => {
    return JSON.parse(localStorage.getItem('usuario') || '{}');
  }, []);

  const token = useMemo(() => {
    return localStorage.getItem('token');
  }, []);

  const tipoUser = usuario?.tipo_user;

  // Função para atualizar loading states
  const setLoading = useCallback((tipo: keyof LoadingStatesType, valor: boolean) => {
    setLoadingStates(prev => ({ ...prev, [tipo]: valor }));
  }, []);

  // Função para atualizar filtros
  const atualizarFiltro = useCallback((campo: keyof FiltrosState, valor: any) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  }, []);

  // Função para atualizar paginação
  const atualizarPaginacao = useCallback((tipo: keyof PaginacaoState, pagina: number) => {
    setPaginacao(prev => ({ ...prev, [tipo]: pagina }));
  }, []);

  // Função para atualizar formulários
  const atualizarFormulario = useCallback((campo: keyof FormulariosState, valor: any) => {
    setFormularios(prev => ({ ...prev, [campo]: valor }));
  }, []);

  // Função principal de carregamento de dados - MEMOIZADA
  const carregarDados = useCallback(async () => {
    setLoading('dados', true);
    setErro(null);
    
    try {
      const resultado = await retryRequest(async () => {
        const headers = { Authorization: `Bearer ${token}` };
        const params = new URLSearchParams();
        
        params.append('page', String(paginacao.pendentes));
        params.append('limit', String(itemsPerPage));
        
        if (debouncedFiltros.parceiro) params.append('parceiro', debouncedFiltros.parceiro);
        if (filtros.canal) params.append('canal_id', filtros.canal);
        if (filtros.vendedor) params.append('consultor', filtros.vendedor);
        if (debouncedFiltros.status) params.append('status', debouncedFiltros.status);
        if (debouncedFiltros.gatilho) params.append('gatilho_extra', debouncedFiltros.gatilho);

        const [resPendentes, resInteragidosHoje, resMeta, resParceiros] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_API_URL}/interacoes/pendentes/?tipo=pendentes&${params.toString()}`,
            { headers }
          ),
          axios.get(`${import.meta.env.VITE_API_URL}/interacoes/hoje/`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/interacoes/pendentes/metas/`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/parceiros-list/`, { headers }),
        ]);

        return {
          pendentes: resPendentes.data,
          interagidosHoje: resInteragidosHoje.data,
          meta: resMeta.data,
          parceiros: resParceiros.data
        };
      });

      // Função para obter nome do canal
      const obterNomeCanal = (id: number): string => {
        const canais = (usuario.canais_venda || []) as CanalVenda[];
        const canal = canais.find((c: CanalVenda) => c.id === id);
        return canal ? canal.nome : '';
      };

      // Atualizar estados com os dados recebidos
      setDados(prev => ({
        ...prev,
        pendentes: resultado.pendentes.dados.map((p: any): Interacao => ({
          ...p,
          canal_venda_nome: obterNomeCanal(p.canal_venda_id),
        })),
        interagidos: resultado.interagidosHoje.map((i: any): Interacao => ({
          id: i.id,
          parceiro: i.parceiro_nome,
          unidade: i.unidade,
          classificacao: i.classificacao,
          status: i.status,
          data_interacao: i.data_interacao,
          tipo: i.tipo,
          gatilho_extra: i.gatilho_extra,
          canal_venda_nome: obterNomeCanal(i.canal_venda_id),
        })),
        parceiros: resultado.parceiros,
        statusDisponiveis: resultado.pendentes.status_disponiveis,
        gatilhosDisponiveis: resultado.pendentes.gatilhos_disponiveis
      }));

      setTotalPendentes(resultado.pendentes.total_count);
      setMeta({
        atual: resultado.meta.interacoes_realizadas,
        total: resultado.meta.meta_diaria
      });

      if (tipoUser === 'GESTOR') {
        const canais = (usuario.canais_venda || []) as CanalVenda[];
        setDados(prev => ({
          ...prev,
          canaisVenda: canais.map((c: CanalVenda) => ({ id: c.id, nome: c.nome }))
        }));
      }

    } catch (err) {
      console.error('Erro ao carregar interações:', err);
      setErro('Erro ao carregar interações. Verifique sua conexão ou login.');
    } finally {
      setLoading('dados', false);
    }
  }, [
    paginacao.pendentes,
    debouncedFiltros.parceiro,
    filtros.canal,
    filtros.vendedor,
    debouncedFiltros.status,
    debouncedFiltros.gatilho,
    token,
    usuario,
    tipoUser,
    itemsPerPage
  ]);

  // Função para carregar vendedores por canal - MEMOIZADA
  const handleCanalChange = useCallback(async (value: string | null) => {
    atualizarFiltro('canal', value || '');
    atualizarFiltro('vendedor', '');
    
    if (!value) {
      setDados(prev => ({ ...prev, vendedores: [] }));
    } else {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/usuarios-por-canal/?canal_id=${value}`,
          { headers }
        );
        setDados(prev => ({ ...prev, vendedores: res.data }));
      } catch (error) {
        console.error('Erro ao carregar vendedores:', error);
      }
    }
  }, [atualizarFiltro, token]);

  // Função para registrar interação - OTIMIZADA
  const registrarInteracao = useCallback(async (
    parceiroId: number,
    tipo: string,
    oportunidade: boolean,
    valor?: number,
    observacao?: string
  ) => {
    if (!tipo) {
      alert('Selecione o tipo de interação');
      return;
    }

    setLoading('interacao', true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const parceiro = dados.pendentes.find((p: Interacao) => p.id === parceiroId);
      const gatilhoExtra = parceiro?.gatilho_extra || null;

      const endpoint = oportunidade 
        ? `${import.meta.env.VITE_API_URL}/oportunidades/registrar/`
        : `${import.meta.env.VITE_API_URL}/interacoes/registrar/`;

      const payload = {
        parceiro: parceiroId,
        tipo,
        observacao,
        gatilho_extra: gatilhoExtra,
        ...(oportunidade && { valor })
      };

      await axios.post(endpoint, payload, { headers });

      // Limpar formulário
      setInteracao(prev => ({
        ...prev,
        expandirId: null,
        valorOportunidade: '',
        observacaoOportunidade: ''
      }));

      // Recarregar dados
      await carregarDados();

    } catch (err) {
      console.error('Erro ao registrar interação:', err);
      alert('Erro ao registrar interação. Tente novamente.');
    } finally {
      setLoading('interacao', false);
    }
  }, [token, dados.pendentes, carregarDados]);

  // Função para salvar gatilho manual - OTIMIZADA
  const salvarGatilhoManual = useCallback(async () => {
    if (!formularios.parceiroSelecionado || !formularios.descricaoGatilho) {
      alert('Selecione o parceiro e preencha a descrição');
      return;
    }

    setLoading('gatilho', true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${import.meta.env.VITE_API_URL}/criar-gatilho-manual/`, {
        parceiro: formularios.parceiroSelecionado,
        usuario: usuario.id,
        descricao: formularios.descricaoGatilho,
      }, { headers });

      alert('Gatilho manual criado com sucesso!');
      
      // Limpar formulário
      atualizarFormulario('descricaoGatilho', '');
      atualizarFormulario('parceiroSelecionado', null);
      atualizarFormulario('mostrarGatilhoManual', false);
      
      await carregarDados();

    } catch (err) {
      console.error('Erro ao criar gatilho manual:', err);
      alert('Erro ao criar gatilho manual');
    } finally {
      setLoading('gatilho', false);
    }
  }, [formularios.parceiroSelecionado, formularios.descricaoGatilho, token, usuario.id, atualizarFormulario, carregarDados]);

  // Função para upload de gatilhos - OTIMIZADA
  const handleUploadGatilho = useCallback(async () => {
    if (!interacao.arquivoGatilho) {
      alert('Selecione um arquivo antes de enviar.');
      return;
    }

    setLoading('upload', true);

    try {
      const formData = new FormData();
      formData.append('file', interacao.arquivoGatilho);
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.post(`${import.meta.env.VITE_API_URL}/upload-gatilhos/`, formData, { headers });
      
      alert('Gatilhos extras enviados com sucesso!');
      setInteracao(prev => ({ ...prev, arquivoGatilho: null }));
      await carregarDados();

    } catch (err) {
      console.error('Erro ao enviar arquivo:', err);
      alert('Erro ao enviar arquivo de gatilhos extras. Verifique o formato.');
    } finally {
      setLoading('upload', false);
    }
  }, [interacao.arquivoGatilho, token, carregarDados]);

  // useEffect principal - CORRIGIDO
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Dados filtrados e paginados - MEMOIZADOS COM TIPO EXPLÍCITO
  const dadosProcessados: DadosProcessados = useMemo(() => {
    const pendentesFiltrados = dados.pendentes.filter((item: Interacao) => 
      !debouncedFiltros.parceiro || String(item.id) === debouncedFiltros.parceiro
    );

    const interagidosFiltrados = dados.interagidos.filter((item: Interacao) => 
      !debouncedFiltros.parceiro || String(item.id) === debouncedFiltros.parceiro
    );

    const interagidosExibidos = interagidosFiltrados.slice(
      (paginacao.interagidos - 1) * itemsPerPage,
      paginacao.interagidos * itemsPerPage
    );

    return {
      pendentesExibidos: pendentesFiltrados,
      interagidosExibidos,
      totalInteragidos: interagidosFiltrados.length
    };
  }, [dados.pendentes, dados.interagidos, debouncedFiltros.parceiro, paginacao.interagidos, itemsPerPage]);

  return (
    <SidebarGestor tipoUser={tipoUser}>
      <div className={styles.pageContainer}>
        <Center mb="md">
          <Title order={2}>Interações de Parceiros Pendentes</Title>
        </Center>

        <Group justify="space-between" mb="md">
          <Badge color={meta.atual >= meta.total ? 'teal' : 'yellow'} size="lg">
            Meta do dia: {meta.atual}/{meta.total}
          </Badge>

          {/* Botões de ação para diferentes tipos de usuário */}
          {(tipoUser === 'ADMIN' || tipoUser === 'GESTOR') && (
            <Group gap="sm">
              <FileButton 
                onChange={(file: File | null) => setInteracao(prev => ({ ...prev, arquivoGatilho: file }))} 
                accept=".xlsx"
              >
                {(props) => <Button {...props}>Selecionar Arquivo de Gatilho</Button>}
              </FileButton>

              <Button
                color="blue"
                onClick={handleUploadGatilho}
                disabled={!interacao.arquivoGatilho}
                loading={loadingStates.upload}
              >
                Enviar Gatilhos
              </Button>

              <Button
                color={formularios.mostrarGatilhoManual ? 'red' : 'teal'}
                variant={formularios.mostrarGatilhoManual ? 'outline' : 'filled'}
                onClick={() => atualizarFormulario('mostrarGatilhoManual', !formularios.mostrarGatilhoManual)}
              >
                {formularios.mostrarGatilhoManual ? 'Fechar Gatilho Manual' : 'Adicionar Gatilho Manual'}
              </Button>
            </Group>
          )}

          {(tipoUser === 'ADMIN' || tipoUser === 'GESTOR' || tipoUser === 'VENDEDOR') && (
            <Button
              variant="filled"
              styles={{
                root: {
                  backgroundColor: '#005A64',
                  '&:hover': { backgroundColor: '#004F57' },
                },
              }}
              onClick={() => atualizarFormulario('mostrarInteracaoManual', !formularios.mostrarInteracaoManual)}
            >
              {formularios.mostrarInteracaoManual
                ? 'Fechar Interação Manual'
                : 'Adicionar Interação Manual'}
            </Button>
          )}
        </Group>

        {/* Formulário de Interação Manual */}
        {formularios.mostrarInteracaoManual && (
          <Card shadow="sm" padding="lg" mb="md">
            <Group grow>
              <Select
                label="Parceiro"
                placeholder="Selecione um parceiro"
                data={dados.parceiros.map((p: Parceiro) => ({ value: String(p.id), label: p.parceiro }))}
                value={formularios.parceiroInteracaoManual}
                onChange={(value: string | null) => atualizarFormulario('parceiroInteracaoManual', value)}
                searchable
                required
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
                value={formularios.tipoInteracaoManual}
                onChange={(value: string | null) => atualizarFormulario('tipoInteracaoManual', value)}
                required
              />

              <TextInput
                label="Valor da Oportunidade (R$)"
                placeholder="5000"
                value={formularios.valorInteracaoManual}
                onChange={(e) => atualizarFormulario('valorInteracaoManual', e.currentTarget.value)}
              />

              <Textarea
                label="Observação"
                placeholder="Detalhes adicionais..."
                value={formularios.obsInteracaoManual}
                onChange={(e) => atualizarFormulario('obsInteracaoManual', e.currentTarget.value)}
                autosize
                minRows={2}
              />
            </Group>

            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                loading={loadingStates.interacao}
                onClick={async () => {
                  try {
                    await axios.post(
                      `${import.meta.env.VITE_API_URL}/interacoes/registrar/`,
                      { 
                        parceiro: formularios.parceiroInteracaoManual, 
                        tipo: formularios.tipoInteracaoManual, 
                        observacao: formularios.obsInteracaoManual 
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    await carregarDados();
                    atualizarFormulario('mostrarInteracaoManual', false);
                  } catch (err) {
                    console.error(err);
                    alert('Erro ao registrar interação.');
                  }
                }}
              >
                Só Interagir
              </Button>

              <Button
                loading={loadingStates.interacao}
                onClick={async () => {
                  try {
                    await axios.post(
                      `${import.meta.env.VITE_API_URL}/oportunidades/registrar/`,
                      {
                        parceiro: formularios.parceiroInteracaoManual,
                        tipo: formularios.tipoInteracaoManual,
                        valor: parseFloat(formularios.valorInteracaoManual.replace(',', '.')),
                        observacao: formularios.obsInteracaoManual,
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    await carregarDados();
                    atualizarFormulario('mostrarInteracaoManual', false);
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

        {/* Formulário de Gatilho Manual */}
        {formularios.mostrarGatilhoManual && (
          <Card shadow="sm" padding="lg" mb="md">
            <Group grow>
              <Select
                label="Parceiro"
                placeholder="Selecione um parceiro"
                data={dados.parceiros.map((p: Parceiro) => ({ value: String(p.id), label: p.parceiro }))}
                value={formularios.parceiroSelecionado}
                onChange={(value: string | null) => atualizarFormulario('parceiroSelecionado', value)}
                searchable
              />
              <TextInput
                label="Descrição do Gatilho"
                placeholder="Ex: Urgente, Precisa Retorno..."
                value={formularios.descricaoGatilho}
                onChange={(e) => atualizarFormulario('descricaoGatilho', e.currentTarget.value)}
              />
              <Button 
                color="blue" 
                onClick={salvarGatilhoManual}
                loading={loadingStates.gatilho}
              >
                Salvar Gatilho Manual
              </Button>
            </Group>
          </Card>
        )}

        {/* Seção de Filtros */}
        <Divider style={{ marginBottom: 8 }} label="Filtros" />

        <Group style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <Select
            label="Filtrar por Parceiro"
            placeholder="Selecione um parceiro"
            value={filtros.parceiro}
            onChange={(value: string | null) => atualizarFiltro('parceiro', value)}
            data={dados.parceiros.map((p: Parceiro) => ({ value: String(p.id), label: p.parceiro }))}
            searchable
            clearable
            style={{ minWidth: 200, marginRight: 16 }}
          />

          {(tipoUser === 'ADMIN' || tipoUser === 'GESTOR') && (
            <>
              <Select
                label="Filtrar por Canal"
                placeholder="Selecione um canal"
                value={filtros.canal}
                onChange={handleCanalChange}
                data={dados.canaisVenda.map((c: CanalVenda) => ({ value: String(c.id), label: c.nome }))}
                clearable
                style={{ minWidth: 200, marginRight: 16 }}
              />

              <Select
                label="Filtrar por Vendedor"
                placeholder="Selecione um vendedor"
                value={filtros.vendedor}
                onChange={(value: string | null) => atualizarFiltro('vendedor', value || '')}
                data={dados.vendedores.map((v: Vendedor) => ({ value: v.id_vendedor, label: v.username }))}
                disabled={!filtros.canal}
                clearable
                style={{ minWidth: 200, marginRight: 16 }}
              />
            </>
          )}

          <Select
            label="Filtrar por Status"
            placeholder="Selecione um status"
            value={filtros.status}
            onChange={(value: string | null) => atualizarFiltro('status', value || '')}
            data={dados.statusDisponiveis.map((s: string) => ({ value: s, label: s }))}
            clearable
            style={{ minWidth: 200, marginRight: 16 }}
          />

          <Select
            label="Filtrar por Gatilho"
            placeholder="Selecione"
            value={filtros.gatilho}
            onChange={(value: string | null) => atualizarFiltro('gatilho', value || '')}
            data={dados.gatilhosDisponiveis.map((g: string) => ({ value: g, label: g }))}
            clearable
            style={{ minWidth: 200 }}
          />
        </Group>

        {/* Conteúdo Principal */}
        {loadingStates.dados ? (
          <Center><Loader /></Center>
        ) : erro ? (
          <Center><Alert color="red" title="Erro">{erro}</Alert></Center>
        ) : (
          <>
            {/* Tabela "A Interagir" */}
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
                  {dadosProcessados.pendentesExibidos.map((item: Interacao) => (
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
                            value={interacao.tipoSelecionado[item.id] || ''}
                            onChange={(v: string | null) => {
                              if (v) {
                                setInteracao(prev => ({
                                  ...prev,
                                  tipoSelecionado: { ...prev.tipoSelecionado, [item.id]: v }
                                }));
                              }
                            }}
                            data={[
                              { value: 'whatsapp', label: 'WhatsApp' },
                              { value: 'email', label: 'E-mail' },
                              { value: 'ligacao', label: 'Ligação' },
                              { value: 'visita', label: 'Visita Presencial' },
                            ]}
                            clearable={false}
                          />
                        </td>
                        <td>
                          <Button 
                            size="xs" 
                            onClick={() => setInteracao(prev => ({ ...prev, expandirId: item.id }))}
                            loading={loadingStates.interacao}
                          >
                            Marcar como interagido
                          </Button>
                        </td>
                      </tr>

                      {interacao.expandirId === item.id && (
                        <tr>
                          <td colSpan={7}>
                            <Group grow style={{ marginTop: 10 }}>
                              <TextInput
                                label="Valor da Oportunidade (R$)"
                                placeholder="5000"
                                value={interacao.valorOportunidade}
                                onChange={(e) => setInteracao(prev => ({ 
                                  ...prev, 
                                  valorOportunidade: e.currentTarget.value 
                                }))}
                              />
                              <Textarea
                                label="Observação"
                                placeholder="Detalhes adicionais..."
                                value={interacao.observacaoOportunidade}
                                onChange={(e) => setInteracao(prev => ({ 
                                  ...prev, 
                                  observacaoOportunidade: e.currentTarget.value 
                                }))}
                              />
                            </Group>
                            <Group style={{ marginTop: 16 }} justify="flex-end">
                              <Button
                                color="blue"
                                loading={loadingStates.interacao}
                                onClick={() => registrarInteracao(
                                  item.id,
                                  interacao.tipoSelecionado[item.id] || '',
                                  true,
                                  parseFloat(interacao.valorOportunidade.replace(',', '.')),
                                  interacao.observacaoOportunidade
                                )}
                              >
                                Salvar e Criar Oportunidade
                              </Button>
                              <Button
                                color="gray"
                                loading={loadingStates.interacao}
                                onClick={() => registrarInteracao(
                                  item.id,
                                  interacao.tipoSelecionado[item.id] || '',
                                  false,
                                  undefined,
                                  undefined
                                )}
                              >
                                Só Interagir
                              </Button>
                              <Button
                                color="red"
                                variant="outline"
                                onClick={() => {
                                  setInteracao(prev => ({
                                    ...prev,
                                    expandirId: null,
                                    valorOportunidade: '',
                                    observacaoOportunidade: ''
                                  }));
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

              {/* Paginação "A Interagir" */}
              <Pagination
                value={paginacao.pendentes}
                onChange={(page: number) => atualizarPaginacao('pendentes', page)}
                total={Math.ceil(totalPendentes / itemsPerPage)}
                mt="md"
              />
            </div>

            {/* Tabela "Interagidos Hoje" */}
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
                  {dadosProcessados.interagidosExibidos.map((item: Interacao) => (
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

              {/* Paginação "Interagidos Hoje" */}
              <Pagination
                value={paginacao.interagidos}
                onChange={(page: number) => atualizarPaginacao('interagidos', page)}
                total={Math.ceil(dadosProcessados.totalInteragidos / itemsPerPage)}
                mt="md"
              />
            </div>
          </>
        )}
      </div>
    </SidebarGestor>
  );
}

