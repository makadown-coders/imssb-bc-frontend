// projects/ti-admin/src/app/pages/inventario.page.ts
import { Component, OnInit, inject, ViewChild, computed, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
import { DispositivoRow, EquipoVM, EstadoDispositivo, Page, SelectOpt, TipoDispositivo } from '../models';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CatalogosService } from '../services/catalogos.service';
import { DispositivosService } from '../services/dispositivos.service';
import { DispositivoRowEx } from '../models/DispositivoRowEx';
import { BehaviorSubject, pipe, Subject, takeUntil } from 'rxjs';
import { DispositivoDetailDialog } from '../shared/dispositivo-detail.dialog';
import { estadoView, iconForEstado } from '../shared/estado.utils';

@Component({
  standalone: true,
  selector: 'ti-inventario-page',
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatMenuModule, MatTooltipModule, MatDividerModule, MatRippleModule,
    MatDialogModule, MatSnackBarModule,
  ],
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss']
})
export class InventarioPage implements OnInit, OnDestroy {

  private api = inject(DispositivosService);
  private cat = inject(CatalogosService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  // dataset de la página actual (viene del servidor)
  items = signal<DispositivoRowEx[]>([]);
  vms = signal<EquipoVM[]>([]);
  total = signal(0);

  // filtros UI
  q = signal<string>('');
  tipo = signal<string | undefined>(undefined);    // id en string
  estado = signal<string | undefined>(undefined);    // id en string

  // paginación server-side
  pageIndex = signal(0);
  pageSize = signal(20);

  // 🔹 Opciones de selects (como signals)
  tipoOptions = signal<SelectOpt[]>([{ value: undefined, label: 'Todos los tipos' }]);
  estadoOptions = signal<SelectOpt[]>([{ value: undefined, label: 'Todos los estados' }]);
  // (opcional) un icono por defecto cuando es "Todos los tipos"
  public readonly defaultTipoIcon = 'devices_other';

  displayedColumns = ['tipo', 'modelo', 'serie', 'ubicacion', 'responsable', 'estado', 'acciones'];

  $onDestroy = new Subject<void>();

  ngOnInit(): void {
    // Cargar opciones de Tipo
    this.cat.tiposDispositivo().pipe(
      takeUntil(this.$onDestroy)
    ).subscribe((ts: TipoDispositivo[]) => {
      const opts: SelectOpt[] = [
        { value: undefined, label: 'Todos los tipos' },
        ...ts.map<SelectOpt>(t => ({ value: String(t.id), label: t.nombre }))
      ];
      console.log('this.tipoOptions', opts);
      this.tipoOptions.set(opts);
    });

    // Cargar opciones de Estado
    this.cat.estadosDispositivo().pipe(
      takeUntil(this.$onDestroy)
    ).subscribe((es: EstadoDispositivo[]) => {
      const opts: SelectOpt[] = [
        { value: undefined, label: 'Todos los estados' },
        ...es.map<SelectOpt>(e => ({ value: String(e.id), label: e.nombre }))
      ];
      this.estadoOptions.set(opts);
    });
    // Efecto: cuando cambian q/tipo/página/tamaño -> pedir al servidor
    // aqui se invoca automaticamente this._loadEffect();
  }

  getTipoOpt() {
    const v = this.tipo();
    return this.tipoOptions().find(o => o.value === v);
  }

  private _norm(s?: string) {
    return (s ?? '')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toUpperCase();
  }

  iconForEstado = iconForEstado;
  // Icono para mostrar en selects/tabla
  /*iconForEstado(label?: string) {
    const t = this._norm(label);
    if (t.includes('USO')) return 'check_circle';  // En Uso
    if (t.includes('REPAR')) return 'build';         // En Reparación
    if (t.includes('RESGU')) return 'inventory_2';   // En Resguardo (almacenado)
    return 'help';
  }*/

  estadoView = estadoView;
  // Chip (clase + label + icono) para la tabla
  /*estadoView(label?: string): { cls: string; label: string; icon: string } {
    const raw = (label ?? '').trim();
    const t = this._norm(raw);

    if (t.includes('USO')) return { cls: 'chip--uso', label: raw || 'En Uso', icon: 'check_circle' };
    if (t.includes('REPAR')) return { cls: 'chip--reparacion', label: raw || 'En Reparación', icon: 'build' };
    if (t.includes('RESGU')) return { cls: 'chip--resguardo', label: raw || 'En Resguardo', icon: 'inventory_2' };

    return { cls: 'chip--desconocido', label: raw || '—', icon: 'help' };
  }*/

  // ✅ effect como propiedad de la clase (injection context OK)
  private readonly _loadEffect = effect(() => {
    console.log('InventarioPage: _loadEffect disparado');
    // leer señales
    const page = this.pageIndex() + 1;
    const pageSize = this.pageSize();
    const q = this.q().trim() || null;
    const tipoId = this.tipo() ? Number(this.tipo()) : null;
    const estadoId = this.estado() ? Number(this.estado()) : null;

    this.api.list({
      q,
      tipo_dispositivo_id: tipoId ?? undefined,
      estado_dispositivo_id: estadoId ?? undefined,
      page,
      pageSize
    }).pipe(
      takeUntil(this.$onDestroy)
    ).subscribe({
      next: (r: Page<DispositivoRowEx>) => {
        this.items.set(r.items ?? []);
        this.total.set(r.total ?? 0);
        this.vms.set((r.items ?? []).map(row => this.mapRow(row)));
      },
      error: () => {
        this.items.set([]); this.total.set(0); this.vms.set([]);
      }
    });
  }, { allowSignalWrites: true });

  // resetear a la primera página cuando cambian filtros
  private readonly _resetPageOnFilter = effect(() => {
    this.q(); this.tipo(); this.estado();
    this.pageIndex.set(0);
  }, { allowSignalWrites: true });

  onPage(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  buscar(ev: Event) {
    const val = (ev.target as HTMLInputElement).value ?? '';
    this.q.set(val);
  }
  tipoLabel() {
    const v = this.tipo();
    const opt = this.tipoOptions().find(o => o.value === v);
    if (opt && opt.label && opt.label.trim().length > 0) return opt.label;
    return 'Todos los tipos';
  }
  estadoLabel() {
    const v = this.estado();
    return this.estadoOptions().find(o => o.value === v)?.label ?? 'Todos los estados';
  }

  private mapRow(r: DispositivoRowEx): EquipoVM {
    return {
      id: String(r.id),
      etiqueta: r.serial ?? '—',
      serie: r.serial,
      tipo: r.tipo,
      marca: r.marca,
      modelo: r.modelo,
      estado: r.estado_dispositivo ?? '—',
      unidad_id: String(r.unidad_medica_id),
      ubicacion: r.unidad_medica,
      responsable_id: r.persona_nombre_completo || r.lugar_especifico || '—'
    };
  }

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

  // Acciones
  add() {
    const ref = this.dialog.open(EquipoDialog, { width: '640px', data: null, autoFocus: false });
    ref.afterClosed().subscribe(ok => { if (ok) this.pageIndex.set(0); }); // para ver el nuevo en la primera página
  }
  edit(row: EquipoVM) {
    const ref = this.dialog.open(EquipoDialog, { width: '640px', data: row, autoFocus: false });
    ref.afterClosed().subscribe(ok => { if (ok) this._reload(); });
  }
  remove(_row: EquipoVM) {
    this.snack.open('Eliminar: pendiente de acordar endpoint', 'Ok', { duration: 2500 });
  }

  // Helper para refrescar manteniendo page/pageSize
  private _reload() {
    // tocar una señal usada por el effect para re-dispararlo:
    this.pageIndex.set(this.pageIndex());
  }

  // Para exportar SOLO la página visible (coherente con paginación server-side)
  exportCSV() {
    const rows = this.vms();
    const head = ['ID', 'Unidad', 'Etiqueta', 'Tipo', 'Marca', 'Modelo', 'Serie', 'Estado', 'Responsable/Lugar'];
    const csv = [
      head.join(','),
      ...rows.map(r => [
        r.id, r.ubicacion ?? '', r.etiqueta ?? '', r.tipo ?? '', r.marca ?? '', r.modelo ?? '', r.serie ?? '',
        r.estado ?? '', r.responsable_id ?? ''
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'inventario_pagina.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  openDetail(vm: EquipoVM) {
    this.dialog.open(DispositivoDetailDialog, {
      width: '940px',              // tamaño “fijo” cómodo en desktop
      height: '620px',
      maxWidth: '98vw',            // fallbacks responsivos
      maxHeight: '98dvh',
      data: vm,
      autoFocus: false,
      panelClass: 'ti-detail-dialog', // para estilos personalizados
    });
  }

  ngOnDestroy(): void {
    this.$onDestroy.next();
    this.$onDestroy.complete();
  }
}
