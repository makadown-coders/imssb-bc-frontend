import { Component, Inject, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DispositivosService} from '../services/dispositivos.service';
import { EquipoVM, DispositivoDetail } from '../models';
import { estadoView } from './estado.utils';

@Component({
  standalone: true,
  selector: 'ti-dispositivo-detail-dialog',
  imports: [
    CommonModule,
    MatDialogModule, MatIconModule, MatButtonModule, MatDividerModule,
    MatChipsModule, MatTabsModule, MatTableModule, MatProgressSpinnerModule
  ],
  templateUrl: './dispositivo-detail.dialog.html'
})
export class DispositivoDetailDialog {
  private api = inject(DispositivosService);
  constructor(
    @Inject(MAT_DIALOG_DATA) public vm: EquipoVM,
    private ref: MatDialogRef<DispositivoDetailDialog>,
  ) {
    this.load();
  }

  loading = signal(true);
  detail = signal<DispositivoDetail | null>(null);
  estadoView = estadoView;

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
        console.log('Dispositivo detail', d);
        this.loading.set(false);        
      },
      error: _ => { this.detail.set(null); this.loading.set(false); }
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
}
