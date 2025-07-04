import { useEffect, useState, Fragment, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Table,
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
  Skeleton,
  Stack,
  
  Box,
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
  usuario_nome?: string; // ✅ <-- ADICIONE ESTA LINHA
  vendedor?: string; // ✅ ADICIONAR ESTA LINHA
}
interface CanalVenda {
  id: number;
  nome: string;
}

interface VendedorSelect {
  value: string;
  label: string;
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
  vendedores: VendedorSelect[];
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
  parceiros: boolean;
  meta: boolean;
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

// Componente de linha virtualizada para tabela
interface VirtualizedRowProps {
  item: Interacao;
  index: number;
  isExpanded: boolean;
  tipoSelecionado: string;
  onExpandToggle: (id: number) => void;
  onTipoChange: (id: number, tipo: string) => void;
  onRegistrarInteracao: (id: number, tipo: string, oportunidade: boolean, valor?: number, observacao?: string) => void;
  valorOportunidade: string;
  observacaoOportunidade: string;
  onValorChange: (valor: string) => void;
  onObservacaoChange: (observacao: string) => void;
  loadingInteracao: boolean;
}

const VirtualizedRow: React.FC<VirtualizedRowProps> = ({
  item,
  isExpanded,
  tipoSelecionado,
  onExpandToggle,
  onTipoChange,
  onRegistrarInteracao,
  valorOportunidade,
  observacaoOportunidade,
  onValorChange,
  onObservacaoChange,
  loadingInteracao
}) => {
  return (
    <Fragment>
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
  {isExpanded ? (
    <Select
      placeholder="Tipo"
      className={styles.select}
      value={tipoSelecionado || ''}
      onChange={(v: string | null) => {
        if (v) {
          onTipoChange(item.id, v);
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
  ) : (
    <span>
      {tipoSelecionado
        ? ({
            whatsapp: 'WhatsApp',
            email: 'E-mail',
            ligacao: 'Ligação',
            visita: 'Visita Presencial'
          } as any)[tipoSelecionado]
        : '-'}
    </span>
  )}
</td>

        <td>
          <Button 
            size="xs" 
            onClick={() => onExpandToggle(item.id)}
            loading={loadingInteracao}
          >
            Marcar como interagido
          </Button>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={7}>
            <Group grow style={{ marginTop: 10 }}>
              <TextInput
                label="Valor da Oportunidade (R$)"
                placeholder="5000"
                value={valorOportunidade}
                onChange={(e) => onValorChange(e.currentTarget.value)}
              />
              <Textarea
                label="Observação"
                placeholder="Detalhes adicionais..."
                value={observacaoOportunidade}
                onChange={(e) => onObservacaoChange(e.currentTarget.value)}
              />
            </Group>
            <Group style={{ marginTop: 16 }} justify="flex-end">
              <Button
                color="blue"
                loading={loadingInteracao}
                onClick={() => onRegistrarInteracao(
                  item.id,
                  tipoSelecionado || '',
                  true,
                  parseFloat(valorOportunidade.replace(',', '.')),
                  observacaoOportunidade
                )}
              >
                Salvar e Criar Oportunidade
              </Button>
              <Button
                color="gray"
                loading={loadingInteracao}
                onClick={() => onRegistrarInteracao(
                  item.id,
                  tipoSelecionado || '',
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
                onClick={() => onExpandToggle(-1)}
              >
                Cancelar
              </Button>
            </Group>
          </td>
        </tr>
      )}
    </Fragment>
  );
};

export default function InteracoesPage() {
  const itemsPerPage = 10;
  const abortControllerRef = useRef<AbortController | null>(null);
 
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
    upload: false,
    parceiros: false,
    meta: false,
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
  const [inicializado, setInicializado] = useState<boolean>(false);

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

  // Função para cancelar requisições pendentes
  const cancelarRequisicoes = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  // Carregamento inicial de dados estáticos (uma vez só)
  const carregarDadosEstaticos = useCallback(async () => {
    if (inicializado) return;
    
    setLoading('parceiros', true);
    setLoading('meta', true);
    
    try {
      const signal = cancelarRequisicoes();
      const headers = { Authorization: `Bearer ${token}` };
  
      // Aqui busca os parceiros e as metas de uma vez só
      const [resParceiros, resMeta] = await Promise.all([
        retryRequest(() => axios.get(`${import.meta.env.VITE_API_URL}/parceiros-list/`, { headers, signal })),
        retryRequest(() => axios.get(`${import.meta.env.VITE_API_URL}/interacoes/pendentes/metas/`, { headers, signal })),
      ]);
  
      // Este trecho preenche os parceiros no estado (era o que você "comentou")
      setDados(prev => ({
        ...prev,
        parceiros: resParceiros.data // ou .data.results se vier paginado!
      }));
  
      setMeta({
        atual: resMeta.data.interacoes_realizadas,
        total: resMeta.data.meta_diaria
      });
  
      if (tipoUser === 'GESTOR') {
        const canais = (usuario.canais_venda || []) as CanalVenda[];
        setDados(prev => ({
          ...prev,
          canaisVenda: canais.map((c: CanalVenda) => ({ id: c.id, nome: c.nome }))
        }));
      }
  
      setInicializado(true);
  
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao carregar dados estáticos:', err);
        setErro('Erro ao carregar dados iniciais. Verifique sua conexão.');
      }
    } finally {
      setLoading('parceiros', false);
      setLoading('meta', false);
    }
  }, [inicializado, token, tipoUser, usuario, cancelarRequisicoes, setLoading]);

  // Função principal de carregamento de dados dinâmicos - OTIMIZADA
  const carregarDadosDinamicos = useCallback(async () => {
    if (!inicializado) return;
    
    setLoading('dados', true);
    setErro(null);
    
    try {
      const signal = cancelarRequisicoes();
      const headers = { Authorization: `Bearer ${token}` };
      const params = new URLSearchParams();
      
      params.append('page', String(paginacao.pendentes));
      params.append('limit', String(itemsPerPage));
      
      if (debouncedFiltros.parceiro) params.append('parceiro', debouncedFiltros.parceiro);
      if (filtros.canal) params.append('canal_id', filtros.canal);
      if (filtros.vendedor) params.append('consultor', filtros.vendedor);
      if (debouncedFiltros.status) params.append('status', debouncedFiltros.status);
      if (debouncedFiltros.gatilho) params.append('gatilho_extra', debouncedFiltros.gatilho);

      // Carrega apenas dados que mudam frequentemente
      const [resPendentes, resInteragidosHoje] = await Promise.all([
        retryRequest(() => axios.get(
          `${import.meta.env.VITE_API_URL}/interacoes/pendentes/?tipo=pendentes&${params.toString()}`,
          { headers, signal }
        )),
        retryRequest(() => axios.get(`${import.meta.env.VITE_API_URL}/interacoes/hoje/`, { headers, signal })),
      ]);

      // Função para obter nome do canal
      const obterNomeCanal = (id: number): string => {
        const canais = (usuario.canais_venda || []) as CanalVenda[];
        const canal = canais.find((c: CanalVenda) => c.id === id);
        return canal ? canal.nome : '';
      };

      // Atualizar estados com os dados recebidos
      setDados(prev => ({
        ...prev,
        pendentes: resPendentes.data.dados.map((p: any): Interacao => ({
          ...p,
          canal_venda_nome: obterNomeCanal(p.canal_venda_id),
        })),
        interagidos: resInteragidosHoje.data.map((i: any): Interacao => ({
          id: i.id,
          parceiro: i.parceiro_nome,
          unidade: i.unidade,
          classificacao: i.classificacao,
          status: i.status,
          data_interacao: i.data_interacao,
          tipo: i.tipo,
          gatilho_extra: i.gatilho_extra,
          canal_venda_nome: obterNomeCanal(i.canal_venda_id),
          vendedor: i.usuario_nome, // ✅ Adicione isto
        })),
        statusDisponiveis: resPendentes.data.status_disponiveis || [],
        gatilhosDisponiveis: resPendentes.data.gatilhos_disponiveis || []
      }));

      setTotalPendentes(resPendentes.data.total_count || 0);

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao carregar interações:', err);
        setErro('Erro ao carregar interações. Verifique sua conexão ou login.');
      }
    } finally {
      setLoading('dados', false);
    }
  }, [
    inicializado,
    paginacao.pendentes,
    debouncedFiltros.parceiro,
    filtros.canal,
    filtros.vendedor,
    debouncedFiltros.status,
    debouncedFiltros.gatilho,
    token,
    usuario,
    itemsPerPage,
    cancelarRequisicoes,
    setLoading
  ]);

  // Função para carregar vendedores por canal - OTIMIZADA
  const handleCanalChange = useCallback(async (value: string | null) => {
    atualizarFiltro('canal', value || '');
    atualizarFiltro('vendedor', '');
  
    if (!value) {
      setDados(prev => ({ ...prev, vendedores: [] }));
    } else {
      const vendedorController = new AbortController(); // 🔥 NOVO controller específico
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await retryRequest(() => axios.get(
          `${import.meta.env.VITE_API_URL}/usuarios-por-canal/?canal_id=${value}`,
          { headers, signal: vendedorController.signal }
        ));
        setDados(prev => ({
          ...prev,
          vendedores: res.data.map((v: any) => ({
            value: v.username,
            label: v.nome || v.username
          }))
        }));
      } catch (error: any) {
        if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
          console.error('Erro ao carregar vendedores:', error);
        }
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
      const signal = cancelarRequisicoes();
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

      await retryRequest(() => axios.post(endpoint, payload, { headers, signal }));

      // Limpar formulário
      setInteracao(prev => ({
        ...prev,
        expandirId: null,
        valorOportunidade: '',
        observacaoOportunidade: ''
      }));

      // Recarregar apenas dados dinâmicos
      await carregarDadosDinamicos();

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao registrar interação:', err);
        alert('Erro ao registrar interação. Tente novamente.');
      }
    } finally {
      setLoading('interacao', false);
    }
  }, [token, dados.pendentes, carregarDadosDinamicos, cancelarRequisicoes, setLoading]);

  // Função para salvar gatilho manual - OTIMIZADA
  const salvarGatilhoManual = useCallback(async () => {
    if (!formularios.parceiroSelecionado || !formularios.descricaoGatilho) {
      alert('Selecione o parceiro e preencha a descrição');
      return;
    }

    setLoading('gatilho', true);

    try {
      const signal = cancelarRequisicoes();
      const headers = { Authorization: `Bearer ${token}` };
      await retryRequest(() => axios.post(`${import.meta.env.VITE_API_URL}/criar-gatilho-manual/`, {
        parceiro: formularios.parceiroSelecionado,
        usuario: usuario.id,
        descricao: formularios.descricaoGatilho,
      }, { headers, signal }));

      alert('Gatilho manual criado com sucesso!');
      
      // Limpar formulário
      atualizarFormulario('descricaoGatilho', '');
      atualizarFormulario('parceiroSelecionado', null);
      atualizarFormulario('mostrarGatilhoManual', false);
      
      await carregarDadosDinamicos();

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao criar gatilho manual:', err);
        alert('Erro ao criar gatilho manual');
      }
    } finally {
      setLoading('gatilho', false);
    }
  }, [formularios.parceiroSelecionado, formularios.descricaoGatilho, token, usuario.id, atualizarFormulario, carregarDadosDinamicos, cancelarRequisicoes, setLoading]);

  // Função para upload de gatilhos - OTIMIZADA
  const handleUploadGatilho = useCallback(async () => {
    if (!interacao.arquivoGatilho) {
      alert('Selecione um arquivo antes de enviar.');
      return;
    }

    setLoading('upload', true);

    try {
      const signal = cancelarRequisicoes();
      const formData = new FormData();
      formData.append('file', interacao.arquivoGatilho);
      const headers = { Authorization: `Bearer ${token}` };
      
      await retryRequest(() => axios.post(`${import.meta.env.VITE_API_URL}/upload-gatilhos/`, formData, { headers, signal }));
      
      alert('Gatilhos extras enviados com sucesso!');
      setInteracao(prev => ({ ...prev, arquivoGatilho: null }));
      await carregarDadosDinamicos();

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao enviar arquivo:', err);
        alert('Erro ao enviar arquivo de gatilhos extras. Verifique o formato.');
      }
    } finally {
      setLoading('upload', false);
    }
  }, [interacao.arquivoGatilho, token, carregarDadosDinamicos, cancelarRequisicoes, setLoading]);

  // useEffect para carregamento inicial
  useEffect(() => {
    carregarDadosEstaticos();
  }, [carregarDadosEstaticos]);

  // useEffect para carregamento de dados dinâmicos
  useEffect(() => {
    carregarDadosDinamicos();
  }, [carregarDadosDinamicos]);

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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

  // Componente de Loading Skeleton
  const LoadingSkeleton = () => (
    <Stack>
      <Skeleton height={50} />
      <Skeleton height={40} />
      <Skeleton height={40} />
      <Skeleton height={40} />
      <Skeleton height={40} />
    </Stack>
  );

  // Handlers para componente virtualizado
  const handleExpandToggle = useCallback((id: number) => {
    setInteracao(prev => ({
      ...prev,
      expandirId: id === -1 ? null : (prev.expandirId === id ? null : id),
      valorOportunidade: id === -1 ? '' : prev.valorOportunidade,
      observacaoOportunidade: id === -1 ? '' : prev.observacaoOportunidade
    }));
  }, []);

  const handleTipoChange = useCallback((id: number, tipo: string) => {
    setInteracao(prev => ({
      ...prev,
      tipoSelecionado: { ...prev.tipoSelecionado, [id]: tipo }
    }));
  }, []);

  const handleValorChange = useCallback((valor: string) => {
    setInteracao(prev => ({ ...prev, valorOportunidade: valor }));
  }, []);

  const handleObservacaoChange = useCallback((observacao: string) => {
    setInteracao(prev => ({ ...prev, observacaoOportunidade: observacao }));
  }, []);

  return (
    <SidebarGestor tipoUser={tipoUser}>
    <div className={styles.pageContainer} style={{ minHeight: '100vh' }}>
        <div className={styles.pageContainer}>
          <Center mb="md">
            <Title order={2}>Interações de Parceiros Pendentes</Title>
          </Center>

          <Group justify="space-between" mb="md">
            {loadingStates.meta ? (
              <Skeleton height={32} width={150} />
            ) : (
              <Badge color={meta.atual >= meta.total ? 'teal' : 'yellow'} size="lg">
                Meta do dia: {meta.atual}/{meta.total}
              </Badge>
            )}

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
                {loadingStates.parceiros ? (
                  <Skeleton height={40} />
                ) : (
                  <Select
                    label="Parceiro"
                    placeholder="Selecione um parceiro"
                    data={dados.parceiros.map((p: Parceiro) => ({ value: String(p.id), label: p.parceiro }))}
                    value={formularios.parceiroInteracaoManual}
                    onChange={(value: string | null) => atualizarFormulario('parceiroInteracaoManual', value)}
                    searchable
                    required
                  />
                )}

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
                      const signal = cancelarRequisicoes();
                      await retryRequest(() => axios.post(
                        `${import.meta.env.VITE_API_URL}/interacoes/registrar/`,
                        { 
                          parceiro: formularios.parceiroInteracaoManual, 
                          tipo: formularios.tipoInteracaoManual, 
                          observacao: formularios.obsInteracaoManual 
                        },
                        { headers: { Authorization: `Bearer ${token}` }, signal }
                      ));
                      await carregarDadosDinamicos();
                      atualizarFormulario('mostrarInteracaoManual', false);
                    } catch (err: any) {
                      if (err.name !== 'AbortError') {
                        console.error(err);
                        alert('Erro ao registrar interação.');
                      }
                    }
                  }}
                >
                  Só Interagir
                </Button>

                <Button
                  loading={loadingStates.interacao}
                  onClick={async () => {
                    try {
                      const signal = cancelarRequisicoes();
                      await retryRequest(() => axios.post(
                        `${import.meta.env.VITE_API_URL}/oportunidades/registrar/`,
                        {
                          parceiro: formularios.parceiroInteracaoManual,
                          tipo: formularios.tipoInteracaoManual,
                          valor: parseFloat(formularios.valorInteracaoManual.replace(',', '.')),
                          observacao: formularios.obsInteracaoManual,
                        },
                        { headers: { Authorization: `Bearer ${token}` }, signal }
                      ));
                      await carregarDadosDinamicos();
                      atualizarFormulario('mostrarInteracaoManual', false);
                    } catch (err: any) {
                      if (err.name !== 'AbortError') {
                        console.error(err);
                        alert('Erro ao criar oportunidade.');
                      }
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
                {loadingStates.parceiros ? (
                  <Skeleton height={40} />
                ) : (
                  <Select
                    label="Parceiro"
                    placeholder="Selecione um parceiro"
                    data={dados.parceiros.map((p: Parceiro) => ({ value: String(p.id), label: p.parceiro }))}
                    value={formularios.parceiroSelecionado}
                    onChange={(value: string | null) => atualizarFormulario('parceiroSelecionado', value)}
                    searchable
                  />
                )}
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
  {loadingStates.parceiros ? (
    <Skeleton height={40} width={200} />
  ) : (
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
  )}

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
        data={dados.vendedores}
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
</Group> {/* ← ESSA LINHA FALTAVA */}


          {/* Conteúdo Principal */}
          {loadingStates.dados && !inicializado ? (
            <LoadingSkeleton />
          ) : erro ? (
            <Center><Alert color="red" title="Erro">{erro}</Alert></Center>
          ) : (
            <>
              {/* Tabela "A Interagir" com Virtualização */}
              <Divider style={{ marginBottom: 8 }} label="A Interagir" />
              <Box className={styles.tableWrapper}>
                {loadingStates.dados ? (
                  <LoadingSkeleton />
                ) : (
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
                      {dadosProcessados.pendentesExibidos.map((item: Interacao, index: number) => (
                        <VirtualizedRow
                          key={item.id}
                          item={item}
                          index={index}
                          isExpanded={interacao.expandirId === item.id}
                          tipoSelecionado={interacao.tipoSelecionado[item.id] || ''}
                          onExpandToggle={handleExpandToggle}
                          onTipoChange={handleTipoChange}
                          onRegistrarInteracao={registrarInteracao}
                          valorOportunidade={interacao.valorOportunidade}
                          observacaoOportunidade={interacao.observacaoOportunidade}
                          onValorChange={handleValorChange}
                          onObservacaoChange={handleObservacaoChange}
                          loadingInteracao={loadingStates.interacao}
                        />
                      ))}
                    </tbody>
                  </Table>
                )}

                {/* Paginação "A Interagir" */}
                <Pagination
                  value={paginacao.pendentes}
                  onChange={(page: number) => atualizarPaginacao('pendentes', page)}
                  total={Math.ceil(totalPendentes / itemsPerPage)}
                  mt="md"
                />
              </Box>

              {/* Tabela "Interagidos Hoje" */}
              <Divider label="Interagidos Hoje" style={{ marginTop: 32, marginBottom: 16 }} />
              <Box className={styles.tableWrapper}>
                {loadingStates.dados ? (
                  <LoadingSkeleton />
                ) : (
                  <Table striped highlightOnHover withTableBorder className={styles.table}>
                    <thead>
  <tr>
    <th>Parceiro</th>
    <th>Unidade</th>
    <th>Classificação</th>
    <th>Status</th>
    <th>Data</th>
    <th>Tipo</th>
    <th>Vendedor</th> {/* <-- nova coluna */}
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
      <td>{item.consultor || item.usuario_nome}</td> {/* <-- nome do vendedor */}
    </tr>
  ))}
</tbody>
                  </Table>
                )}

                {/* Paginação "Interagidos Hoje" */}
                <Pagination
                  value={paginacao.interagidos}
                  onChange={(page: number) => atualizarPaginacao('interagidos', page)}
                  total={Math.ceil(dadosProcessados.totalInteragidos / itemsPerPage)}
                  mt="md"
                />
              </Box>
            </>
          )}
        </div>
        </div>
</SidebarGestor>
  );
}

