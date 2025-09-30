export type DispositivoRowEx = {
  id: number;
  serial: string | null;
  marca: string | null;
  modelo: string | null;
  ip: string | null;
  conexion: string | null;
  tipo: string;
  unidad_medica_id: number;
  unidad_medica: string;

  asignacion_dispositivo_id?: number | null;
  persona_id?: number | null;
  persona_nombre_completo?: string | null;
  lugar_especifico?: string | null;
  estado_dispositivo_id?: number | null;
  estado_dispositivo?: string | null;
  fecha_asignacion?: string | null;
  fecha_retiro?: string | null;
};