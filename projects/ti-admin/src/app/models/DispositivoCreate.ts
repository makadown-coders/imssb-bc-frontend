
/**
 * Modelo para crear un dispositivo
 */
export class DispositivoCreate {
  unidad_medica_id?: number;
  tipo_dispositivo_id: number = 0;
  ip?: string;
  conexion?: string;
  serial?: string;
  marca?: string;
  modelo?: string;
  observaciones?: string;
}