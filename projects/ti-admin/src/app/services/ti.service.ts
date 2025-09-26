import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
// TODO: conectar a HttpClient con base en API_URL de env.json (pendiente de acordar contrato)

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

@Injectable({ providedIn: 'root' })
export class TiService {
  private _rows = new BehaviorSubject<Equipo[]>([
    { id: 'EQ-0001', etiqueta: 'BC-TI-0001', tipo: 'PC', marca: 'Dell', modelo: 'OptiPlex 7090', estado: 'OPERATIVO', unidad_id: 'HGE', ubicacion: 'Oficina TI', responsable_id: 'usr:hector', fecha_alta: '2025-09-01' },
    { id: 'EQ-0002', etiqueta: 'BC-TI-0002', tipo: 'LAPTOP', marca: 'HP', modelo: 'ProBook 440', estado: 'MANTENIMIENTO', unidad_id: 'HGX', ubicacion: 'Taller', responsable_id: 'usr:elia' },
    { id: 'EQ-0003', etiqueta: 'BC-TI-0003', tipo: 'IMPRESORA', marca: 'Brother', modelo: 'HL-L2350DW', estado: 'OPERATIVO', unidad_id: 'HGT', ubicacion: 'Archivo', responsable_id: 'usr:sandra' }
  ]);

  list(): Observable<Equipo[]> { return this._rows.asObservable(); }

  create(partial: Equipo) {
    const id = partial.id && partial.id.trim() ? partial.id : this.nextId();
    const row = { ...partial, id };
    this._rows.next([row, ...this._rows.value]);
  }

  update(id: string, patch: Partial<Equipo>) {
    this._rows.next(this._rows.value.map(r => r.id === id ? { ...r, ...patch } : r));
  }

  remove(id: string) {
    this._rows.next(this._rows.value.filter(r => r.id !== id));
  }

  exportCSV(rows: Equipo[]) {
    // Export mínimo CSV; XLSX quedará pendiente de acordar librería/contrato
    const headers = ['id','etiqueta','serie','tipo','marca','modelo','estado','unidad_id','ubicacion','responsable_id','fecha_alta','notas'];
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => JSON.stringify((r as any)[h] ?? '')).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'inventario.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  exportXLSX(_rows: Equipo[]) {
    // Pendiente: definir librería (xlsx/exceljs) y formato con columnas acordadas.
    // De momento, usar CSV como fallback.
    this.exportCSV(_rows);
  }

  private nextId(): string {
    const n = this._rows.value.length + 1;
    return `EQ-${n.toString().padStart(4,'0')}`;
  }
}
