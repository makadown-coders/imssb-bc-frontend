export type EquipoVM = {
  id: string;
  etiqueta: string;
  serie?: string | null;
  tipo: string;                // usamos el nombre del tipo
  marca?: string | null;
  modelo?: string | null;
  estado?: string;             // TODO: vendrá de historial; por ahora '—'
  unidad_id?: string;          // backend: unidad_medica_id
  ubicacion?: string;          // backend: unidad_medica (nombre)
  responsable_id?: string;     // TODO
  fecha_alta?: string;
  notas?: string;
};

