export type Equipo = {
  id: string;
  etiqueta: string;
  serie?: string;
  tipo: 'PC'|'LAPTOP'|'IMPRESORA'|'ROUTER'|'SWITCH'|'OTRO';
  marca?: string;
  modelo?: string;
  estado: 'OPERATIVO'|'MANTENIMIENTO'|'BAJA'|'EXTRAVIADO';
  unidad_id?: string;
  ubicacion?: string;
  responsable_id?: string;
  fecha_alta?: string;
  notas?: string;
};
