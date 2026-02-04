// projects/ti-admin/src/app/shared/dispositivo-detail.dialog.ts
import { Component, computed, DestroyRef, effect, Inject, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DispositivosService } from '../services/dispositivos.service';
import { EquipoVM, DispositivoDetail, AsignacionBitacoraRow, Page } from '../models';
import { estadoView } from './estado.utils';

// ⬇️ importa los sub-dialogs de edición
import { CambiarAsignacionDialog } from './cambiar-asignacion.dialog';
import { EditMonitorDialog } from './edit-monitor.dialog';
import { EditPerifericoDialog } from './edit-periferico.dialog';
import { EditDispositivoDialog } from './edit-dispositivo.dialog';
import { MatMenuModule } from '@angular/material/menu';
import { CatalogosService } from '../services/catalogos.service';
import { ConfirmDialog } from './confirm-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  selector: 'ti-dispositivo-detail-dialog',
  imports: [
    CommonModule,
    MatDialogModule, MatIconModule, MatButtonModule, MatDividerModule,
    MatChipsModule, MatTabsModule, MatTableModule, MatProgressSpinnerModule,
    MatMenuModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatPaginatorModule,
    FormsModule, MatNativeDateModule
  ],
  templateUrl: './dispositivo-detail.dialog.html'
})
export class DispositivoDetailDialog {
  private api = inject(DispositivosService);
  private cat = inject(CatalogosService);
  private dialog = inject(MatDialog);
  private _snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  private historialSub: Subscription | null = null;

  loading = signal(true);
  detail = signal<DispositivoDetail | null>(null);
  estadoView = estadoView;
  tabIndex = signal(0);

  // ===================== HISTORIAL (BITÁCORA) =====================
  historialFrom = signal<Date | null>(null);
  historialTo = signal<Date | null>(null);
  historialPage = signal(1);
  historialPageSize = signal(10);

  historialLoading = signal(false);
  historialTotal = signal(0);
  historialItems = signal<AsignacionBitacoraRow[]>([]);

  private historialActive = computed(() => this.tabIndex() === 3);

  changingEstado = false;
  // menú de estados (desde catálogo)
  estadoOpts = signal<Array<{ id: number; label: string; icon: string }>>([]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public vm: EquipoVM,
    private ref: MatDialogRef<DispositivoDetailDialog>,
  ) {
    this.load();
    this.loadEstados();
    // Carga el historial cuando el tab está activo (y cuando cambian filtros/paginación)
    effect(() => {
      if (!this.historialActive()) return;

      const dispositivoId = Number(this.vm.id);
      const from = this.historialFrom();
      const to = this.historialTo();
      const page = this.historialPage();
      const pageSize = this.historialPageSize();

      // cancelar petición previa si sigue viva
      this.historialSub?.unsubscribe();

      this.historialLoading.set(true);
      this.historialSub = this.api.listAsignaciones(dispositivoId, {
        from: from ? from.toISOString() : null,
        to: to ? to.toISOString() : null,
        page,
        pageSize
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (r: Page<AsignacionBitacoraRow>) => {
          this.historialItems.set(r.items ?? []);
          this.historialTotal.set(r.total ?? 0);
          this.historialLoading.set(false);
        },
        error: _ => {
          this.historialLoading.set(false);
          this._snackBar.open('No se pudo cargar el historial.', 'Cerrar', { duration: 3000 });
        }
      });
    });

  }

  get title() {
    return `${this.vm.tipo} — ${this.vm.marca ?? ''} ${this.vm.modelo ?? ''}`.trim();
  }

  close() { this.ref.close(); }

  load() {
    const id = Number(this.vm.id);
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: d => {
        this.detail.set(d);
        this.vm.marca = d.marca || null;
        this.vm.modelo = d.modelo || null;
        this.vm.serie = d.serial;
        
        if (d?.asignacion_actual) {
          const estado = this.estadoOpts()
              .find(e => e.id === d.asignacion_actual!.estado_dispositivo_id)
          this.vm.estado = estado ? estado.label : 'En Resguardo';
          this.vm.responsable_id = d.asignacion_actual.nombre_completo ||
                d.asignacion_actual.lugar_especifico || '—'
        }
        this.loading.set(false);
      },
      error: _ => { this.detail.set(null); this.loading.set(false); }
    });
  }

  /** Handy para re-cargar tras guardar en sub-dialogs */
  private reload() { this.load(); }

  /** Cargar catálogo y mapear icono con tu estadoView */
  private loadEstados() {
    this.cat.estadosDispositivo().subscribe({
      next: (es: Array<{ id: number; nombre: string }>) => {        
        const opts = es.map(e => ({
          id: e.id,
          label: e.nombre,
          icon: estadoView(e.nombre).icon
        }));
        this.estadoOpts.set(opts);
      },
      error: _ => {
        // fallback estático si algo falla
        this.estadoOpts.set([
          { id: 1, label: 'En Uso', icon: 'check_circle' },
          { id: 2, label: 'En Reparación', icon: 'build' },
          { id: 3, label: 'En Resguardo', icon: 'inventory_2' },
        ]);
      }
    });
  }

  /** Estado activo: por id si viene en detail; si no, por label */
  isActiveEstado(e: { id: number; label: string }) {
    const d: any = this.detail();
    if (d?.estado_dispositivo_id != null) return Number(d.estado_dispositivo_id) === e.id;
    // fallback por texto (normaliza con tu util)
    return this.estadoView(this.vm.estado).label === this.estadoView(e.label).label;
  }

  /** Cambiar estado con UI optimista + recarga de respaldo */
  setEstado(e: { id: number; label: string }) {
    if (this.isActiveEstado(e)) return;

    this.changingEstado = true;

    // pinta optimista en cabecera
    const prev = this.vm.estado;
    this.vm.estado = e.label;

    const dispositivoDetail = this.detail();

    this.api.cambiarAsignacion(
      Number(this.vm.id), // id del dispositivo 
      {
        persona_id: dispositivoDetail?.asignacion_actual?.persona_id || null,
        lugar_especifico: this.vm.ubicacion || null,
        estado_dispositivo_id: e.id,
      }).subscribe({
        next: _ => {
          this.reload();            // refuerza consistencia (id/label)
          this.changingEstado = false;
        },
        error: _ => {
          this.vm.estado = prev || undefined;  // revertir si falla
          this.changingEstado = false;
        }
      });
  }

  // ===== Acciones: Resumen =====
  editResumen() {
    const d = this.detail();
    if (!d) return;

    this.dialog.open(EditDispositivoDialog, {
      width: '840px',
      height: '820px',
      maxWidth: '198vw',
      data: {
        id: Number(this.vm.id),
        ip: d.ip ?? null,
        conexion: d.conexion ?? null,
        observaciones: d.observaciones ?? null,
        serial: this.vm.serie ?? null,
        marca: this.vm.marca ?? null,
        modelo: this.vm.modelo ?? null,
        macs: this.nicList() ?? [] // aqui no encuentro donde cachar las macs
      }
    }).afterClosed().subscribe(ok => { if (ok) this.reload(); });
  }

  cambiarAsignacion() {
    const d = this.detail();
    if (!d) return;

    this.dialog.open(CambiarAsignacionDialog, {
      width: '640px',
      maxWidth: '98vw',
      data: {
         id: Number(this.vm.id),
      unidad_medica_id: d.unidad_medica_id ?? null,      // 👈 si tu /api/dispositivos/:id trae esto
      unidad_medica_label: (this.vm.ubicacion ?? null),
      estado_dispositivo_id: d.asignacion_actual?.estado_dispositivo_id ?? null,
      persona_nombre_completo: this.vm.responsable_id || null,
      }
    }).afterClosed().subscribe(ok => { if (ok) {
      this._snackBar.open('Asignación actualizada', 'Cerrar');      
      this.reload();
    } });
  }

  // ===== Acciones: Monitores =====
  addMonitor() {
    this.dialog.open(EditMonitorDialog, {
      width: '560px',
      maxWidth: '98vw',
      data: { dispositivo_id: Number(this.vm.id), monitor: null }
    }).afterClosed().subscribe(ok => {
      if (ok) {
        this._snackBar.open('Monitor agregado', 'Cerrar');
        this.reload();
      }
    });
  }

  editMonitor(m: any) {
    this.dialog.open(EditMonitorDialog, {
      width: '560px',
      maxWidth: '98vw',
      data: { dispositivo_id: Number(this.vm.id), monitor: m }
    }).afterClosed().subscribe(ok => {
      if (ok) {
        this._snackBar.open('Monitor guardado', 'Cerrar');
        this.reload();
      }
    });
  }

  // ===== Acciones: Periféricos =====
  addPeriferico() {
    this.dialog.open(EditPerifericoDialog, {
      width: '560px',
      maxWidth: '98vw',
      data: { dispositivo_id: Number(this.vm.id), periferico: null }
    }).afterClosed().subscribe(ok => {
      if (ok) {
        this._snackBar.open('Periférico agregado', 'Cerrar');
        this.reload();
      }
    });
  }

  editPeriferico(p: any) {
    this.dialog.open(EditPerifericoDialog, {
      width: '560px',
      maxWidth: '98vw',
      data: { dispositivo_id: Number(this.vm.id), periferico: p }
    }).afterClosed().subscribe(ok => {
      if (ok) {
        this._snackBar.open('Periférico guardado', 'Cerrar');
        this.reload();
      }
    });
  }

  // ===== Historial =====
  onHistorialBuscar() {
    this.historialPage.set(1);
  }

  onHistorialLimpiar() {
    this.historialFrom.set(null);
    this.historialTo.set(null);
    this.historialPage.set(1);
  }

  onHistorialPageChange(ev: any) {
    this.historialPage.set((ev?.pageIndex ?? 0) + 1);
    this.historialPageSize.set(ev?.pageSize ?? 10);
  }

  exportHistorialCsv() {
    const rows = this.historialItems();
    if (!rows.length) {
      this._snackBar.open('No hay datos para exportar.', 'OK', { duration: 2500 });
      return;
    }

    const header = [
      'desde','hasta','unidad_medica','persona','lugar_especifico','estado_dispositivo','observaciones','creado_por','asignacion_id'
    ];

    const esc = (v: any) => {
      const s = String(v ?? '');
      return `"${s.replaceAll('"', '""')}"`;
    };

    const lines = [
      header.map(esc).join(','),
      ...rows.map(r => ([
        r.desde,
        r.hasta ?? '',
        r.unidad_medica ?? '',
        r.persona ?? '',
        r.lugar_especifico ?? '',
        r.estado_dispositivo ?? '',
        r.observaciones ?? '',
        r.creado_por ?? '',
        r.id
      ]).map(esc).join(','))
    ];

    const blob = new Blob([lines.join('\\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial-dispositivo-${Number(this.vm.id)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  revertirAEstePunto(row: AsignacionBitacoraRow) {
    const dispositivoId = Number(this.vm.id);
    this.api.revertAsignacion(dispositivoId, row.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: _ => {
          this._snackBar.open('Reversión aplicada. Se registró un nuevo movimiento.', 'OK', { duration: 3500 });
          this.historialPage.set(1);
        },
        error: _ => this._snackBar.open('No se pudo revertir.', 'Cerrar', { duration: 3000 })
      });
  }


  // Reutiliza tus helpers si quieres coherencia visual:
  iconForTipo(input: string) {
    const key = (input || '').toUpperCase();
    if (key.includes('LAP')) return 'laptop_mac';
    if (key.includes('PC') || key.includes('CPU') || key.includes('ESCRITORIO')) return 'desktop_windows';
    if (key.includes('IMP')) return 'print';
    if (key.includes('ROUT') || key.includes('SWITCH') || key.includes('AP')) return 'device_hub';
    return 'devices_other';
  }

  nicList() {
    const d: any = this.detail();
    return (d?.nics || d?.macs || []) as Array<{
      mac: string; iface_name?: string; kind?: string; en_uso?: boolean;
    }>;
  }

  iconForNic(kind?: string) {
    switch ((kind || '').toLowerCase()) {
      case 'wifi': return 'wifi';
      case 'mgmt': return 'settings';
      case 'bt': return 'bluetooth';
      case 'ethernet': return 'settings_ethernet';
      default: return 'memory';
    }
  }

  nicKindLabel(kind?: string) {
    switch ((kind || '').toLowerCase()) {
      case 'wifi': return 'Wi-Fi';
      case 'mgmt': return 'Gestión';
      case 'bt': return 'Bluetooth';
      case 'ethernet': return 'Ethernet';
      default: return 'Otro';
    }
  }

  deleteMonitor(m: any) {
    const dispositivoId = Number(this.vm.id);
    if (!m?.id) return;

    // Confirmación simple. Si prefieres un MatDialog bonito, te lo paso después.
    //const ok = window.confirm('¿Eliminar este monitor? Esta acción no se puede deshacer.');
    this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Eliminar monitor',
        message: '¿Seguro que deseas eliminar este monitor?'
      }
    }).afterClosed().subscribe(ok => {
      if (!ok) return;

      this.api.deleteMonitor(dispositivoId, Number(m.id)).subscribe({
        next: _ => {
          this._snackBar.open('Monitor eliminado', 'Cerrar');
          this.reload();
        },
        error: _ => {
          // opcional: MatSnackBar
          console.error('No se pudo eliminar el monitor');
        }
      });
    });
  }

  deletePeriferico(p: any) {
    const dispositivoId = Number(this.vm.id);
    if (!p?.id) return;

    this.dialog.open(ConfirmDialog, {
      data: { title: 'Eliminar periférico', message: '¿Seguro que deseas eliminar este periférico?' }
    }).afterClosed().subscribe(ok => {
      if (!ok) return;

      this.api.deletePeriferico(dispositivoId, Number(p.id)).subscribe({
        next: _ => { this._snackBar.open('Periférico eliminado', 'Cerrar'); this.reload(); },
        error: _ => console.error('No se pudo eliminar el periférico')
      });
    });
  }
}
