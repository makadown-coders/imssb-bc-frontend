import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Equipo } from '../services/ti.service';

type DialogData = { mode: 'create'|'edit'; value?: Partial<Equipo> };

@Component({
  standalone: true,
  selector: 'ti-equipo-dialog',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule
  ],
   templateUrl: './equipo-dialog.html'
})
export class EquipoDialog {
  fb = inject(FormBuilder);
  form = this.fb.group({
    id: [''],
    etiqueta: ['', Validators.required],
    serie: [''],
    tipo: ['PC', Validators.required],
    marca: [''],
    modelo: [''],
    estado: ['OPERATIVO', Validators.required],
    unidad_id: [''],
    ubicacion: [''],
    responsable_id: [''],
    fecha_alta: [''],
    notas: ['']
  });

  constructor(
    private ref: MatDialogRef<EquipoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    if (data.value) this.form.patchValue(data.value);
  }

  close() { this.ref.close(); }
  save() { if (this.form.valid) this.ref.close(this.form.value); }
}
