// projects/ti-admin/src/app/shared/dispositivo-detail.dialog.ts
import { Component, Inject, inject, signal } from '@angular/core';
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
import { EquipoVM, DispositivoDetail } from '../models';
import { estadoView } from './estado.utils';

// ⬇️ importa los sub-dialogs de edición
import { CambiarAsignacionDialog } from './cambiar-asignacion.dialog';
import { EditMonitorDialog } from './edit-monitor.dialog';
import { EditPerifericoDialog } from './edit-periferico.dialog';
import { EditDispositivoDialog } from './edit-dispositivo.dialog';
import { MatMenuModule } from '@angular/material/menu';
import { CatalogosService } from '../services/catalogos.service';

@Component({
  standalone: true,
  selector: 'ti-dispositivo-detail-dialog',
  imports: [
    CommonModule,
    MatDialogModule, MatIconModule, MatButtonModule, MatDividerModule,
    MatChipsModule, MatTabsModule, MatTableModule, MatProgressSpinnerModule,
    MatMenuModule
  ],
  templateUrl: './dispositivo-detail.dialog.html'
})
export class DispositivoDetailDialog {
  private api = inject(DispositivosService);
  private cat = inject(CatalogosService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  detail = signal<DispositivoDetail | null>(null);
  estadoView = estadoView;

  changingEstado = false;
  // menú de estados (desde catálogo)
  estadoOpts = signal<Array<{ id: number; label: string; icon: string }>>([]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public vm: EquipoVM,
    private ref: MatDialogRef<DispositivoDetailDialog>,
  ) {
    this.load();
    this.loadEstados();
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
        // TODO: si back devuelve nombre del estado, úsalo para pintar chip
        // if (d?.estado_dispositivo) this.vm.estado = d.estado_dispositivo;
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
        // estado_dispositivo_id: d.estado_dispositivo_id ?? null,
        persona_nombre_completo: this.vm.responsable_id || null,
        //lugar_especifico: d.lugar_especifico || null
      }
    }).afterClosed().subscribe(ok => { if (ok) this.reload(); });
  }

  // ===== Acciones: Monitores =====
  addMonitor() {
    this.dialog.open(EditMonitorDialog, {
      width: '560px',
      maxWidth: '98vw',
      data: { dispositivo_id: Number(this.vm.id), monitor: null }
    }).afterClosed().subscribe(ok => { if (ok) this.reload(); });
  }

  editMonitor(m: any) {
    this.dialog.open(EditMonitorDialog, {
      width: '560px',
      maxWidth: '98vw',
      data: { dispositivo_id: Number(this.vm.id), monitor: m }
    }).afterClosed().subscribe(ok => { if (ok) this.reload(); });
  }

  // ===== Acciones: Periféricos =====
  addPeriferico() {
    this.dialog.open(EditPerifericoDialog, {
      width: '560px',
      maxWidth: '98vw',
      data: { dispositivo_id: Number(this.vm.id), periferico: null }
    }).afterClosed().subscribe(ok => { if (ok) this.reload(); });
  }

  editPeriferico(p: any) {
    this.dialog.open(EditPerifericoDialog, {
      width: '560px',
      maxWidth: '98vw',
      data: { dispositivo_id: Number(this.vm.id), periferico: p }
    }).afterClosed().subscribe(ok => { if (ok) this.reload(); });
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
}
