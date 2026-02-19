
export interface TicketData {
  plataforma: 'FRESH' | 'BLIP';
  numeroTicket: string;
  fila: string;
  agente: string;
  dataOriginal: string;
  dataObj: Date;
  categoria: string;
  ahtOriginal: string;
  frtOriginal: string;
  ahtSeconds: number;
  frtSeconds: number;
  cliente: string;
  csat: number; // Nota de satisfação (0-5)
}

export interface PlatformMetrics {
  platform: string;
  count: number;
  avgAHT: number;
  avgFRT: number;
  categories: Record<string, number>;
  agents: Record<string, { count: number; aht: number; frt: number }>;
}

export interface DashboardMetrics {
  totalTickets: number;
  freshMetrics: PlatformMetrics;
  blipMetrics: PlatformMetrics;
}
