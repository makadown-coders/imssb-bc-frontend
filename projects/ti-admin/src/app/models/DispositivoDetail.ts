import { NicItem } from "./DispositivoNic";
import { Monitor } from "./Monitor";
import { Periferico } from "./Periferico";


export interface DispositivoDetail {
  // lo que el backend devuelve actualmente en byId:
  id: number; unidad_medica_id: number; tipo_dispositivo_id: number;
  ip: string | null; conexion: string | null; serial: string | null;
  marca: string | null; modelo: string | null; observaciones: string | null;
  monitores: Monitor[];
  perifericos: Periferico[];
  macs: NicItem[];
  asignacion_actual: DispositivoAsignacion | null;
}

/**
 * Vista simplificada para el diálogo
 * Ejemplo:
 *  {
        "id": 130,
        "dispositivo_id": 165,
        "persona_id": null,
        "lugar_especifico": "sin asignar",
        "estado_dispositivo_id": 3,
        "fecha_asignacion": "2025-07-23T03:43:50.502Z",
        "fecha_retiro": null,
        "observaciones": "",
        "creado_por": null,
        "nombre_completo": null,
        "estado_nombre": "En Resguardo"
    }
 */
export interface DispositivoAsignacion {
  id: number; 
  dispositivo_id: number;
  persona_id: number | null;
  lugar_especifico: string | null;
  estado_dispositivo_id: number | null;
  fecha_asignacion: string; // ISO
  fecha_retiro: string | null; // ISO
  observaciones: string | null;
  creado_por: string | null;
  nombre_completo: string | null; // de persona_id
  estado_nombre: string | null; // de estado_dispositivo_id
}