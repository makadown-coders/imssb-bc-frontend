// projects/ti-admin/src/app/shared/equipo-dialog.ts
import { Component, inject, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Equipo, TipoDispositivo, UnidadMedica } from '../models';
import { CatalogosService } from '../services/catalogos.service';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

type DialogData = { mode: 'create'|'edit'; value?: Partial<Equipo> };

@Component({
  standalone: true,
  selector: 'ti-equipo-dialog',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule,
    MatAutocompleteModule
  ],
   templateUrl: './equipo-dialog.html'
})
export class EquipoDialog {
  private ref = inject(MatDialogRef<EquipoDialog>);
  private fb = inject(FormBuilder);
  private cat = inject(CatalogosService);

  // Select Tipo
  tipoOpts = signal<TipoDispositivo[]>([]);
  // Autocomplete Unidad
  unidadOpts = signal<UnidadMedica[]>([]);
  unidadTerm = signal<string>('');

  form = this.fb.group({
    // 👇 obligatorios para backend create()
    unidad_medica_id: [null as number | null, Validators.required],
    tipo_dispositivo_id: [null as number | null, Validators.required],
    // 👇 opcionales
    serial: [''],
    marca: [''],
    modelo: [''],
    ip: [''],
    conexion: [''],
    observaciones: [''],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    // Cargar tipos
    this.cat.tiposDispositivo().subscribe(ts => this.tipoOpts.set(ts));
    // Si viene valor inicial (modo 'edit' temporal)
    if (data?.value) {
      this.form.patchValue(data.value);
      if ((data.value as any)?.unidad_label) this.unidadTerm.set((data.value as any).unidad_label);
    } else {
      // modo 'create' - limpio unidad
      this.clearUnidad();
      // inicializo data
      this.data = { mode: 'create' };
    }
  }

  // -------- Unidad: búsqueda sencilla ----------
  onUnidadInput(event: Event) {
    const q = (event.target as HTMLInputElement).value ?? '';
    this.unidadTerm.set(q);
    this.form.get('unidad_medica_id')!.setValue(null);
    if (!q.trim()) { this.unidadOpts.set([]); return; }

    this.cat.unidades({ q: q.trim(), page: 1, pageSize: 20 })
      .subscribe(r => this.unidadOpts.set(r.items));
  }

  chooseUnidad(u: UnidadMedica) {
    this.form.get('unidad_medica_id')!.setValue(u.id);
    this.unidadTerm.set(`${u.nombre}${u.municipio ? ' · ' + u.municipio : ''}`);
  }

  clearUnidad() {
    this.form.get('unidad_medica_id')!.setValue(null);
    this.unidadTerm.set('');
    this.unidadOpts.set([]);
  }

  close() { this.ref.close(false); }
  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Devuelvo payload tal cual lo espera POST /api/dispositivos
    this.ref.close(this.form.value);
  }
}
