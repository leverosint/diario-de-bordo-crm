// Tipos para o Dashboard baseados nos endpoints do backend
export interface KPI {
    title: string;
    value: number | string;
  }
  
  export interface ResumoParceiroMensal {
    parceiro_id: number;
    codigo: string;
    parceiro: string;
    consultor: string;
    unidade: string;
    status_parceiro: string;
    data_ref: string;
    total_interacoes: number;
    interacoes_whatsapp: number;
    interacoes_ligacao: number;
    interacoes_email: number;
    total_oportunidades: number;
    valor_total_oportunidades: number;
    oportunidades_pedido: number;
    oportunidades_perdida: number;
    oportunidades_oportunidade: number;
    oportunidades_orcamento: number;
    oportunidades_aguardando: number;
  }
  
  export interface DashboardKPIResponse {
    kpis: KPI[];
    interacoes_status: Record<string, number>;
    parceiros_contatados_status: Record<string, number>;
    parceiros_sem_fat_status: Record<string, number>;
    parceiros: any[]; // Mantém compatibilidade com código existente
  }
  
  export interface ConsultorOption {
    value: string;
    label: string;
  }