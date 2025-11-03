import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CatalogosService } from '../services/catalogos.service';
import { PersonasApiService } from '../services/personas-api.service';
import { UnidadMedica } from '../models/UnidadMedica';

type DialogData = {
  mode: 'create' | 'edit';
  value?: {
    id?: number;
    nombre_completo?: string;
    unidad_medica_id?: number | null;
    unidad_label?: string | null;
    // opcional: si más adelante cargamos correos existentes
    correos?: string[];
  }
};

@Component({
  standalone: true,
  selector: 'ti-persona-dialog',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatAutocompleteModule,
    MatChipsModule, MatTooltipModule
  ],
  templateUrl: './persona-dialog.html'
})
export class PersonaDialog implements OnInit {
  private cats = inject(CatalogosService);
  private api = inject(PersonasApiService);
  private ref = inject(MatDialogRef<PersonaDialog>);

  public data: DialogData = inject(MAT_DIALOG_DATA);

  // Unidad autocomplete
  unidadTerm = signal<string>('');
  unidadSel = signal<UnidadMedica | null>(null);
  unidadOpts = signal<UnidadMedica[]>([]);
  saving = signal(false);

  // Correos (chips). Regla: el primero es “principal”.
  correos = signal<string[]>([]);

  fb = inject(FormBuilder);
  form = this.fb.group({
    nombre_completo: ['', [Validators.required, Validators.maxLength(255)]],
    // unidad la llevamos aparte; aquí no usamos control para mantener el patrón de autocomplete
    correoInput: ['']
  });

  ngOnInit(): void {
    if (this.data?.value) {
      if (this.data.value.nombre_completo) this.form.patchValue({ nombre_completo: this.data.value.nombre_completo });

      if (this.data.value.unidad_medica_id) {
        // precarga suave: setea sólo label, ya que no tenemos todo el objeto
        this.unidadSel.set({ id: this.data.value.unidad_medica_id, nombre: this.data.value.unidad_label ?? '' } as any);
        if (this.data.value.unidad_label) this.unidadTerm.set(this.data.value.unidad_label);
      }

      if (Array.isArray(this.data.value.correos) && this.data.value.correos.length) {
        this.correos.set(this.data.value.correos);
      }
    }
  }

  // ------- UNIDAD ----------
  onUnidadInput(ev: Event) {
    const val = (ev.target as HTMLInputElement)?.value ?? '';
    this.unidadTerm.set(val);
    this.unidadSel.set(null);
    const term = val.trim();
    this.cats.unidades({ q: term || null, page: 1, pageSize: 20 })
      .subscribe(r => this.unidadOpts.set(r.items));
  }
  chooseUnidad(u: UnidadMedica) {
    this.unidadSel.set(u);
    this.unidadTerm.set(`${u.nombre}${u.municipio ? ' · ' + u.municipio : ''}`);
  }
  clearUnidad() {
    this.unidadSel.set(null);
    this.unidadTerm.set('');
    this.unidadOpts.set([]);
  }

  // ------- CORREOS ----------
  private isEmail(s: string) {
    // validación simple
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim().toLowerCase());
  }
  addCorreoFromInput() {
    const raw = (this.form.value.correoInput || '').trim();
    if (!raw) return;
    if (!this.isEmail(raw)) { this.form.patchValue({ correoInput: '' }); return; }

    const list = this.correos();
    if (!list.includes(raw.toLowerCase())) {
      this.correos.set([...list, raw.toLowerCase()]);
    }
    this.form.patchValue({ correoInput: '' });
  }
  removeCorreo(c: string) {
    this.correos.set(this.correos().filter(x => x !== c));
  }
  makePrimary(c: string) {
    const rest = this.correos().filter(x => x !== c);
    this.correos.set([c, ...rest]); // el primero es el principal
  }

  // ------- GUARDAR ----------
  cancel() { this.ref.close(false); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);

    const nombre = (this.form.value.nombre_completo || '').trim();
    const unidadId = this.unidadSel()?.id ?? null;
    const correos = this.correos();

    // Nota: por convenio, el primer correo del array se toma como “principal”.
    const payload = { nombre_completo: nombre, unidad_medica_id: unidadId, correos };

    if (this.data?.mode === 'edit' && this.data.value?.id) {
      this.api.update(this.data.value.id, payload).subscribe({
        next: _ => this.ref.close(true),
        error: _ => this.ref.close(false),
        complete: () => this.saving.set(false)
      });
    } else {
      this.api.create(payload).subscribe({
        next: _ => this.ref.close(true),
        error: _ => this.ref.close(false),
        complete: () => this.saving.set(false)
      });
    }
  }

  get correoInputError(): string | null {
    const raw = (this.form.value.correoInput ?? '').trim().toLowerCase();
    if (!raw) return null;
    // valídalo como prefieras (regex simple)
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!re.test(raw)) return 'Formato de correo inválido.';
    if ((this.correos() ?? []).some(c => c.toLowerCase() === raw)) return 'El correo ya existe en la lista.';
    return null;
  }
}
