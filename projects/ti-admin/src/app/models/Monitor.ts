
export interface Monitor {
  id: number; dispositivo_id: number;
  serial: string | null; marca: string | null; modelo: string | null;
  es_principal?: boolean | null;
}
