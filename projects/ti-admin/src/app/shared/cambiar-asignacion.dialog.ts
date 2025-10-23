
import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EstadoDispositivo, UnidadMedica } from '../models';
import { PersonaLite } from '../models/Personalite';
import { CatalogosService } from '../services/catalogos.service';
import { DispositivosService } from '../services/dispositivos.service';
import { IMSSBBC_DATE_FORMATS } from './IMSSBBC-date-formats';

@Component({
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule,
        MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
        MatAutocompleteModule, MatDatepickerModule, MatNativeDateModule,
        MatIconModule, MatButtonModule],
    providers: [provideNativeDateAdapter(),
    { provide: MAT_DATE_FORMATS, useValue: IMSSBBC_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }
    ],
    selector: 'ti-cambiar-asignacion-dialog',
    templateUrl: 'cambiar-asignacion.dialog.html'
})

export class CambiarAsignacionDialog implements OnInit {
    public ref = inject(MatDialogRef<CambiarAsignacionDialog>);
    private cat = inject(CatalogosService);
    private api = inject(DispositivosService);
    
    public data: {
            id: number;
            unidad_medica_id?: number | null;
            unidad_medica_label?: string | null;
            estado_dispositivo_id?: number | null;
            persona_nombre_completo?: string | null;
        } = inject(MAT_DIALOG_DATA);

    // datos de entrada (puedes pasar unidad/estado actuales para precargar)
    constructor() {
        // precarga labels si vienen
        if (this.data?.unidad_medica_label) this.unidadTerm.set(this.data.unidad_medica_label);
    }

    // -------- Estado de UI --------
    saving = signal(false);

    // Select de estado
    estados = signal<EstadoDispositivo[]>([]);
    // Auto-complete unidad
    unidadOpts = signal<UnidadMedica[]>([]);
    unidadSel = signal<UnidadMedica | null>(null);
    unidadTerm = signal<string>('');

    // Auto-complete persona (global)
    personaOpts = signal<PersonaLite[]>([]);
    personaSel = signal<PersonaLite | null>(null);
    personaTerm = signal<string>('');

    // Form (fecha + estado + lugar)
    f: FormGroup = inject(FormBuilder).group({
        estado_id: new FormControl<number | null>(this.data?.estado_dispositivo_id ?? null),
        fecha: new FormControl<Date | null>(new Date()),
        lugar: new FormControl<string>('', []),
    });

    ngOnInit() {
        // estados
        this.cat.estadosDispositivo().subscribe(es => this.estados.set(es));
        // intenta pre-seleccionar unidad si viene id+label
        if (this.data?.unidad_medica_id && this.data?.unidad_medica_label) {
            this.unidadSel.set({ id: this.data.unidad_medica_id, nombre: this.data.unidad_medica_label } as any);
            this.unidadTerm.set(this.data.unidad_medica_label);
        }
        // si no hay persona y no hay lugar, sugiere “sin asignar”
        if (!this.personaSel() && !this.f.value.lugar) {
            this.f.patchValue({ lugar: 'sin asignar' });
        }
    }

    // ------- Búsquedas ----------
    searchUnidad(q: string) {
        this.unidadTerm.set(q);
        this.unidadSel.set(null); // si el usuario teclea, “rompe” la selección previa
        const term = q.trim();
        this.cat.unidades({ q: term || null, page: 1, pageSize: 20 })
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

    searchPersona(q: string) {
        this.personaTerm.set(q);
        this.personaSel.set(null);
        const term = q.trim();
        
        this.cat.personas({ q: term || null, page: 1, pageSize: 20 })
            .subscribe(r => this.personaOpts.set(r.items));
    }
    choosePersona(p: PersonaLite) {
        this.personaSel.set(p);
        this.personaTerm.set(p.nombre_completo);
    }
    clearPersona() {
        this.personaSel.set(null);
        this.personaTerm.set('');
        // si queda sin persona y sin lugar, vuelve a “sin asignar”
        if (!this.f.value.lugar) this.f.patchValue({ lugar: 'sin asignar' });
    }

    // ------- Guardar ----------
    cancel() { this.ref.close(false); }

    save() {
        const unidad = this.unidadSel();
        if (!unidad) return; // unidad requerida

        const estado_id = this.f.value.estado_id ?? null;
        const fechaISO = this.f.value.fecha ? new Date(this.f.value.fecha).toISOString() : null;
        const persona_id = this.personaSel()?.id ?? null;
        let lugar = (this.f.value.lugar || '').trim();

        // Reglas: al menos persona o lugar; si ninguno => 'sin asignar'
        if (!persona_id && !lugar) lugar = 'sin asignar';

        this.saving.set(true);
        this.api.cambiarAsignacion(this.data.id, {
            unidad_medica_id: unidad.id,
            persona_id,
            lugar_especifico: lugar || null,
            estado_dispositivo_id: estado_id,
            fecha_asignacion: fechaISO
        }).subscribe({
            next: _ => { this.saving.set(false); this.ref.close(true); },
            error: _ => { this.saving.set(false); this.ref.close(false); }
        });
    }

    onPersonaInput(event: Event) {
        const input = event.target as HTMLInputElement;
        this.searchPersona(input.value);
    }

    onUnidadInput(event: Event) {
        const input = event.target as HTMLInputElement;
        this.searchUnidad(input.value);
    }
}