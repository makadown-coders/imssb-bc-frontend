
export type Monitor = {
  id?: number;
  serial?: string | null;
  marca?: string | null;
  modelo?: string | null;
  es_principal?: boolean | null;
};


export type EditMonitorData = {
  dispositivo_id: number;
  monitor: { id?: number; serial?: string | null; marca?: string | null; modelo?: string | null; es_principal?: boolean } | null;
};