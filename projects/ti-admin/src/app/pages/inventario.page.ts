import { Component, OnInit, inject, ViewChild, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TiService } from '../services/ti.service';
import { EquipoDialog } from '../shared/equipo-dialog';
import { Equipo } from '../models/Equipo';
import { EstadoKey } from '../models/EstadoKey';
import { TipoKey } from '../models/TipoKey';
import { DispositivoRow, EquipoVM, TipoDispositivo } from '../models';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CatalogosService } from '../services/catalogos.service';
import { DispositivosService } from '../services/dispositivos.service';

@Component({
  standalone: true,
  selector: 'ti-inventario-page',
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatMenuModule, MatTooltipModule, MatDividerModule, MatRippleModule,
    MatDialogModule, MatSnackBarModule
  ],
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss']
})
export class InventarioPage implements OnInit {
  private api = inject(DispositivosService);
  private cat = inject(CatalogosService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  // dataset real (crudo) y view-model
  rows = signal<DispositivoRow[]>([]);
  vms = signal<EquipoVM[]>([]);

  // filtros UI (mantengo tu UI actual)
  q = signal<string>('');
  tipo = signal<string | undefined>(undefined);   // value = id en string o undefined
  estado = signal<string | undefined>(undefined); // NO-OP por ahora

  // opciones de selects
  tipoOptions = signal<{ value: string | undefined; label: string; }[]>([{ value: undefined, label: 'Todos los tipos' }]);
  estadoOptions = signal<{ value: string | undefined; label: string; }[]>([
    { value: undefined, label: 'Todos los estados' } // hasta que definamos historial/estado actual
  ]);

  displayedColumns = ['tipo', 'modelo', 'serie', 'ubicacion', 'responsable', 'estado', 'acciones'];

  // 👇 crea el effect como campo de clase (esto SÍ tiene injection context)
  private readonly _syncVMs = effect(() => {
    const all = this.rows();
    const q = this.q().trim().toLowerCase();
    const tipoId = this.tipo();

    const filtered = all.filter(r => {
      const okTipo = !tipoId || tipoId === String((r as any).tipo_dispositivo_id ?? '');
      const hay = [r.serial ?? '', r.marca ?? '', r.modelo ?? '', r.unidad_medica ?? '']
        .some(s => s.toLowerCase().includes(q));
      return okTipo && hay;
    });

    this.vms.set(filtered.map(r => this.mapRow(r)));
  }, { allowSignalWrites: true }); // opcional pero útil si el compilador te advierte

  ngOnInit(): void {
    // carga tipos para el filtro
    this.cat.tiposDispositivo().subscribe(ts => {
      const opts: { value: string | undefined; label: string; }[] =
       [{ value: undefined, label: 'Todos los tipos' }];
      for (const t of ts) opts.push({ value: String(t.id), label: t.nombre });
      this.tipoOptions.set(opts);
    });

    // carga inicial del inventario (real)
    this.load();
  }

  private load() {
    // Si quieres filtrar por tipo en el server, pásalo aquí:
    const tipoIdNum = this.tipo() ? Number(this.tipo()) : undefined;
    this.api.list({ tipo_dispositivo_id: tipoIdNum, q: this.q().trim() || null }).subscribe({
      next: rows => { this.rows.set(rows ?? []); },
      error: () => {
        this.rows.set([]);
        this.snack.open('No se pudo cargar el inventario', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // === Handlers de filtros ===
  buscar(ev: Event) {
    const val = (ev.target as HTMLInputElement).value ?? '';
    this.q.set(val);
    // Si prefieres filtrar en servidor, llama this.load();
  }
  tipoLabel() {
    const v = this.tipo();
    return this.tipoOptions().find(o => o.value === v)?.label ?? 'Todos los tipos';
  }
  estadoLabel() {
    return 'Todos los estados'; // placeholder
  }

  // === Mapeo row -> VM que espera tu template ===
  private mapRow(r: DispositivoRow): EquipoVM {
    return {
      id: String(r.id),
      etiqueta: r.serial ?? '—',      // tu UI usaba "etiqueta" como asset tag; mapeo serial
      serie: r.serial,
      tipo: r.tipo,                   // label del tipo
      marca: r.marca,
      modelo: r.modelo,
      estado: '—',                    // TODO: estado actual desde historial
      unidad_id: String(r.unidad_medica_id),
      ubicacion: r.unidad_medica,     // mostramos nombre de la unidad
      responsable_id: '—'             // TODO
    };
  }

  // === Helpers de UI ya usados en tu HTML ===
  filtered = computed(() => this.vms());

  iconForTipo(input: string) {
    const key = (input || '').toUpperCase();
    if (key.includes('LAP')) return 'laptop_mac';
    if (key.includes('PC') || key.includes('CPU') || key.includes('ESCRITORIO')) return 'desktop_windows';
    if (key.includes('IMP')) return 'print';
    if (key.includes('ROUT') || key.includes('SWITCH') || key.includes('AP')) return 'device_hub';
    return 'devices_other';
  }
  labelForTipo(input: string) { return input || '—'; }
  seriePill(r: EquipoVM) { return r.serie || '—'; }
  estadoView(_estado?: string) { return { cls: 'chip--mantenimiento', label: _estado ?? '—' }; } // placeholder

  // === Acciones ===
  add() {
    const ref = this.dialog.open(EquipoDialog, {
      width: '640px',
      data: null,
      autoFocus: false
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.load(); });
  }
  edit(row: EquipoVM) {
    const ref = this.dialog.open(EquipoDialog, {
      width: '640px',
      data: row,
      autoFocus: false
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.load(); });
  }
  remove(row: EquipoVM) {
    // TODO: crear endpoint DELETE /api/dispositivos/:id (aún no lo definimos)
    this.snack.open('Eliminar: pendiente de acordar endpoint', 'Ok', { duration: 2500 });
  }

  exportCSV() {
    const rows = this.filtered();
    const head = ['ID', 'Unidad', 'Etiqueta', 'Tipo', 'Marca', 'Modelo', 'Serie'];
    const csv = [
      head.join(','),
      ...rows.map(r => [
        r.id, r.ubicacion ?? '', r.etiqueta ?? '', r.tipo ?? '', r.marca ?? '', r.modelo ?? '', r.serie ?? ''
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inventario.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
