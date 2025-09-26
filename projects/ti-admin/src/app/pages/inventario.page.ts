import { Component, OnInit, inject, ViewChild, computed, signal } from '@angular/core';
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
import { Equipo, TiService } from '../services/ti.service';
import { EquipoDialog } from '../shared/equipo-dialog';

type EstadoKey = Equipo['estado'];
type TipoKey = Equipo['tipo'];

@Component({
  standalone: true,
  selector: 'ti-inventario-page',
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatMenuModule, MatTooltipModule, MatDividerModule, MatRippleModule,
    MatDialogModule
  ],
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss']
})
export class InventarioPage implements OnInit {
  private svc = inject(TiService);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = ['tipo', 'modelo', 'serie', 'ubicacion', 'responsable', 'estado', 'acciones'];

  // Filtros / búsqueda
  q = signal<string>('');
  tipo = signal<'ALL' | TipoKey>('ALL');
  estado = signal<'ALL' | EstadoKey>('ALL');

  // Datos
  raw = signal<Equipo[]>([]);
  filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    const t = this.tipo();
    const e = this.estado();

    return this.raw().filter(r => {
      const text = [
        r.etiqueta, r.serie, r.tipo, r.marca, r.modelo, r.ubicacion, r.responsable_id, r.estado
      ].map(v => (v ?? '').toString().toLowerCase()).join(' | ');
      const matchQ = q ? text.includes(q) : true;
      const matchT = t === 'ALL' ? true : r.tipo === t;
      const matchE = e === 'ALL' ? true : r.estado === e;
      return matchQ && matchT && matchE;
    });
  });

  // Opciones de filtros
  readonly tipoOptions: { value: 'ALL' | TipoKey; label: string }[] = [
    { value: 'ALL', label: 'Todos los Tipos' },
    { value: 'PC', label: 'Desktop' },
    { value: 'LAPTOP', label: 'Laptop' },
    { value: 'IMPRESORA', label: 'Impresora' },
    { value: 'ROUTER', label: 'Router' },
    { value: 'SWITCH', label: 'Switch' },
    { value: 'OTRO', label: 'Otro' },
  ];
  readonly estadoOptions: { value: 'ALL' | EstadoKey; label: string }[] = [
    { value: 'ALL', label: 'Todos los Estados' },
    { value: 'OPERATIVO', label: 'En Uso' },
    { value: 'MANTENIMIENTO', label: 'En Reparación' },
    { value: 'BAJA', label: 'De Baja' },
    { value: 'EXTRAVIADO', label: 'Extraviado' },
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.svc.list().subscribe(rows => this.raw.set(rows));
  }

  // UI helpers ---------------------------------------------------------------

  iconForTipo(t: TipoKey): string {
    switch (t) {
      case 'LAPTOP': return 'laptop';
      case 'PC': return 'desktop_windows';
      case 'IMPRESORA': return 'print';
      case 'ROUTER': return 'router';
      case 'SWITCH': return 'lan';
      default: return 'devices_other';
    }
  }

  labelForTipo(t: TipoKey): string {
    switch (t) {
      case 'LAPTOP': return 'Laptop';
      case 'PC': return 'Desktop';
      case 'IMPRESORA': return 'Printer';
      case 'ROUTER': return 'Router';
      case 'SWITCH': return 'Switch';
      default: return 'Otro';
    }
  }

  estadoView(e: EstadoKey): { label: string; cls: string } {
    switch (e) {
      case 'OPERATIVO': return { label: 'En Uso', cls: 'chip--operativo' };
      case 'MANTENIMIENTO': return { label: 'En Reparación', cls: 'chip--mantenimiento' };
      case 'BAJA': return { label: 'De Baja', cls: 'chip--baja' };
      case 'EXTRAVIADO': return { label: 'Extraviado', cls: 'chip--extraviado' };
    }
  }

  seriePill(r: Equipo) {
    // Muestra siempre como SN-XXXXX si el valor no lo trae ya con prefijo
    const v = (r.serie || '').trim();
    return v.toUpperCase().startsWith('SN-') ? v.toUpperCase() : ('SN-' + v.toUpperCase());
  }

  // Acciones -----------------------------------------------------------------

  add() {
    this.dialog.open(EquipoDialog, { width: '720px', data: { mode: 'create' } })
      .afterClosed().subscribe((res?: Partial<Equipo>) => { if (res) this.svc.create(res as Equipo); });
  }

  edit(row: Equipo) {
    this.dialog.open(EquipoDialog, { width: '720px', data: { mode: 'edit', value: row } })
      .afterClosed().subscribe((res?: Partial<Equipo>) => { if (res) this.svc.update(row.id, res); });
  }

  remove(row: Equipo) { this.svc.remove(row.id); }

  exportCSV() { this.svc.exportCSV(this.filtered()); }
  exportXLSX() { this.svc.exportXLSX(this.filtered()); }

  buscar(e: Event) { this.q.set((e.target as HTMLInputElement).value); }
  tipoLabel = computed(() =>
    this.tipoOptions.find(o => o.value === this.tipo())?.label ?? 'Todos los Tipos'
  );
  estadoLabel = computed(() =>
    this.estadoOptions.find(o => o.value === this.estado())?.label ?? 'Todos los Estados'
  );
}
