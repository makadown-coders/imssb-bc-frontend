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
}
