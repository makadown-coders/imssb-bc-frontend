// projects/ti-admin/src/app/pages/personas.page.ts
import { Component, OnDestroy, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CatalogosService } from '../services/catalogos.service';
import { PersonasApiService } from '../services/personas-api.service';
import { Subject, takeUntil } from 'rxjs';
import { PersonaLite } from '../models/Personalite';
import { Page, UnidadMedica } from '../models';
import { EditPersonaDialog } from '../shared/edit-persona.dialog';

@Component({
    standalone: true,
    selector: 'ti-personas-page',
    imports: [
        CommonModule, FormsModule,
        MatTableModule, MatPaginatorModule,
        MatFormFieldModule, MatInputModule, MatIconModule,
        MatButtonModule, MatAutocompleteModule, MatDialogModule, MatSnackBarModule
    ],
    templateUrl: './personas.page.html',
})
export class PersonasPage implements OnInit, OnDestroy {
    private cat = inject(CatalogosService);
    private api = inject(PersonasApiService);
    private dialog = inject(MatDialog);
    private snack = inject(MatSnackBar);

    // dataset
    items = signal<PersonaLite[]>([]);
    total = signal(0);

    // filtros
    q = signal<string>('');
    unidadTerm = signal<string>('');
    unidadSel = signal<UnidadMedica | null>(null);
    unidadOpts = signal<UnidadMedica[]>([]);

    // paginación
    pageIndex = signal(0);
    pageSize = signal(20);

    displayedColumns = ['nombre', 'unidad', 'acciones'];
    $onDestroy = new Subject<void>();

    ngOnInit(): void {
        // efecto: dispara carga cuando cambian filtros/paginación
        this.pageIndex.set(this.pageIndex());
        this.pageSize.set(this.pageSize());
        this.q.set(this.q());
        this.unidadSel.set(this.unidadSel());
        // this._loadEffect();
        // reset page al cambiar filtros
        // this._resetOnFilters();
    }

    private _loadEffect = effect(() => {
        const page = this.pageIndex() + 1;
        const size = this.pageSize();
        const q = this.q().trim() || null;
        const unidadId = this.unidadSel()?.id ?? null;

        this.cat.personas({ q, unidad_medica_id: unidadId, page, pageSize: size })
            .pipe(takeUntil(this.$onDestroy))
            .subscribe({
                next: (r: Page<PersonaLite>) => { this.items.set(r.items ?? []); this.total.set(r.total ?? 0); },
                error: () => { this.items.set([]); this.total.set(0); }
            });
    }, { allowSignalWrites: true });

    private _resetOnFilters = effect(() => {
        this.q(); this.unidadSel();
        this.pageIndex.set(0);
    }, { allowSignalWrites: true });

    onPage(e: PageEvent) {
        this.pageIndex.set(e.pageIndex);
        this.pageSize.set(e.pageSize);
    }

    buscar(ev: Event) { this.q.set((ev.target as HTMLInputElement).value ?? ''); }

    // Unidad autocomplete
    onUnidadInput(ev: Event) {
        const term = (ev.target as HTMLInputElement).value ?? '';
        this.unidadTerm.set(term);
        this.unidadSel.set(null);
        this.cat.unidades({ q: term.trim() || null, page: 1, pageSize: 20 })
            .pipe(takeUntil(this.$onDestroy))
            .subscribe(r => this.unidadOpts.set(r.items));
    }
    chooseUnidad(u: UnidadMedica) {
        this.unidadSel.set(u);
        this.unidadTerm.set(`${u.nombre}${u.municipio ? ' · ' + u.municipio : ''}`);
    }
    clearUnidad() { this.unidadSel.set(null); this.unidadTerm.set(''); this.unidadOpts.set([]); }

    // CRUD
    add() {
        this.dialog.open(EditPersonaDialog, {
            width: '560px', maxWidth: '98vw',
            data: { persona: null }
        }).afterClosed().subscribe(val => {
            if (!val) return;
            this.api.create(val).subscribe({
                next: _ => { this.snack.open('Persona creada', 'Cerrar', { duration: 2000 }); this._reload(); },
                error: _ => this.snack.open('No se pudo crear', 'Cerrar', { duration: 2500 })
            });
        });
    }

    edit(p: PersonaLite) {
        this.dialog.open(EditPersonaDialog, {
            width: '560px', maxWidth: '98vw',
            data: { persona: p }
        }).afterClosed().subscribe(val => {
            if (!val) return;
            this.api.update(Number(p.id), val).subscribe({
                next: _ => { this.snack.open('Cambios guardados', 'Cerrar', { duration: 2000 }); this._reload(); },
                error: _ => this.snack.open('No se pudo guardar', 'Cerrar', { duration: 2500 })
            });
        });
    }

    remove(p: PersonaLite) {
        if (!confirm(`¿Eliminar “${p.nombre_completo}”?`)) return;
        this.api.remove(Number(p.id)).subscribe({
            next: _ => { this.snack.open('Persona eliminada', 'Cerrar', { duration: 2000 }); this._reload(); },
            error: _ => this.snack.open('No se pudo eliminar', 'Cerrar', { duration: 2500 })
        });
    }

    private _reload() { this.pageIndex.set(this.pageIndex()); }

    ngOnDestroy(): void {
        this.$onDestroy.next();
        this.$onDestroy.complete();
    }

    clearSearch(input?: HTMLInputElement) {
        if (input) input.value = '';
        this.q.set('');
    }
}
