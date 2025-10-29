// projects/ti-admin/src/app/shared/edit-persona.dialog.ts
import { CommonModule } from '@angular/common';
import { Component, Inject, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { CatalogosService } from '../services/catalogos.service';
import { UnidadMedica } from '../models';
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { PersonaLite } from '../models/Personalite';

type DialogData = { persona: PersonaLite | null };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

@Component({
  standalone: true,
  selector: 'ti-edit-persona-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatAutocompleteModule, MatChipsModule
  ],
  templateUrl: './edit-persona.dialog.html'
})
export class EditPersonaDialog {
  private ref = inject(MatDialogRef<EditPersonaDialog>);
  private fb = inject(FormBuilder);
  private cat = inject(CatalogosService);
  private $destroy = new Subject<void>();

  unidadTerm = signal<string>('');
  unidadSel  = signal<UnidadMedica | null>(null);
  unidadOpts = signal<UnidadMedica[]>([]);

  form = this.fb.group({
    nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
    unidad_medica_id: new FormControl<number | null>(null),
    correos: this.fb.array<FormControl<string | null>>([])
  });

  get correosFA() { return this.form.get('correos') as FormArray<FormControl<string | null>>; }

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    if (data?.persona) {
      // precarga nombre/unidad; (correos vendrán cuando agreguemos read a detalle)
      this.form.patchValue({
        nombre_completo: data.persona.nombre_completo,
        unidad_medica_id: data.persona.unidad_medica_id ?? null
      });
      if (data.persona.unidad_medica) this.unidadTerm.set(data.persona.unidad_medica);
    }
  }

  // Unidad autocomplete
  onUnidadInput(ev: Event) {
    const term = (ev.target as HTMLInputElement).value ?? '';
    this.unidadTerm.set(term);
    this.unidadSel.set(null);
    this.cat.unidades({ q: term.trim() || null, page: 1, pageSize: 20 })
      .pipe(takeUntil(this.$destroy))
      .subscribe(r => this.unidadOpts.set(r.items));
  }
  chooseUnidad(u: UnidadMedica) {
    this.unidadSel.set(u);
    this.unidadTerm.set(`${u.nombre}${u.municipio ? ' · ' + u.municipio : ''}`);
    this.form.patchValue({ unidad_medica_id: u.id });
  }
  clearUnidad() {
    this.unidadSel.set(null);
    this.unidadTerm.set('');
    this.unidadOpts.set([]);
    this.form.patchValue({ unidad_medica_id: null });
  }

  addCorreoFromInput(input: HTMLInputElement) {
    const val = (input.value || '').trim();
    if (!val) return;
    if (!EMAIL_RE.test(val)) { input.classList.add('ng-invalid'); return; }
    if (this.correosFA.value.some(c => (c || '').toLowerCase() === val.toLowerCase())) { input.value = ''; return; }
    this.correosFA.push(new FormControl<string | null>(val, [Validators.pattern(EMAIL_RE)]));
    input.value = '';
  }
  removeCorreo(i: number) { this.correosFA.removeAt(i); }

  cancel() { this.ref.close(false); }
  save() {
    if (this.form.invalid) return;
    const out = {
      nombre_completo: this.form.value.nombre_completo!.trim(),
      unidad_medica_id: this.form.value.unidad_medica_id ?? null,
      correos: (this.correosFA.value || []).filter(Boolean)
    };
    this.ref.close(out);
  }
}
