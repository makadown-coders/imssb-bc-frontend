
export interface AsignacionBitacoraRow {
    id: number;
    dispositivo_id: number;

    tipo_dispositivo_id: number | null;
    tipo_dispositivo: string | null;
    serial: string | null;
    marca: string | null;
    modelo: string | null;

    desde: string; // ISO
    hasta: string | null; // ISO (LEAD)

    unidad_medica_id: number | null;
    unidad_medica: string | null;

    persona_id: number | null;
    persona: string | null;

    lugar_especifico: string | null;

    estado_dispositivo_id: number | null;
    estado_dispositivo: string | null;

    observaciones: string | null;
    creado_por: string | null;
    fecha_retiro: string | null;
}
