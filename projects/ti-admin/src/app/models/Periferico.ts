export interface Periferico {
  id: number;
  dispositivo_id: number;
  tipo: string | null;
  tipo_id: number | null;
  serial: string | null;
  marca: string | null;
  modelo: string | null;
}

export type PerifericoData = {
  dispositivo_id: number;
  periferico: {
    id?: number;
    tipo_id?: number | null;
    serial?: string | null;
    marca?: string | null;
    modelo?: string | null
  } | null;
};
