// projects/ti-admin/src/app/models/DispositivoRow.ts
export type DispositivoRow = {
    id: number;
    serial: string | null;
    marca: string | null;
    modelo: string | null;
    ip: string | null;
    conexion: string | null;
    tipo: string; // nombre del tipo_dispositivo
    unidad_medica_id: number;
    unidad_medica: string; // nombre de la unidad
};
