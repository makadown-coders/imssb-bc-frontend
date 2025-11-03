// projects/ti-admin/src/app/pages/personas.page.ts
import { Component, OnDestroy, OnInit, inject, signal, effect, computed, DestroyRef, Injector } from '@angular/core';
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
import { catchError, debounceTime, distinctUntilChanged, finalize, map, of, Subject, switchMap, tap } from 'rxjs';
import { PersonaLite } from '../models/Personalite';
import { Page, UnidadMedica } from '../models';
import { EditPersonaDialog } from '../shared/edit-persona.dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialog } from '../shared/confirm-dialog';
import { PersonaDialog } from '../shared/persona-dialog';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Sort } from '@angular/material/sort';

@Component({
    standalone: true,
    selector: 'ti-personas-page',
    imports: [
        CommonModule, FormsModule,
        MatTableModule, MatPaginatorModule,
        MatFormFieldModule, MatInputModule,
        MatButtonModule, MatIconModule,
        MatDialogModule, MatTooltipModule,
        MatAutocompleteModule, MatSnackBarModule
    ],
    templateUrl: './personas.page.html',
})
export class PersonasPage implements OnInit, OnDestroy {
    private injector = inject(Injector);
    private catalogoService = inject(CatalogosService);
    private personaService = inject(PersonasApiService);
    private dialog = inject(MatDialog);
    private snack = inject(MatSnackBar);
    private destroyRef = inject(DestroyRef);

    // dataset
    items = signal<PersonaLite[]>([]);
    total = signal(0);

    // loading
    loading = signal(false);

    // filtros
    q = signal<string>('');
    unidadTerm = signal<string>('');
    unidadSel = signal<UnidadMedica | null>(null);
    unidadOpts = signal<UnidadMedica[]>([]);

    // paginación
    pageIndex = signal(0);
    pageSize = signal(20);

    // sort (cliente sobre la página actual)
    sortActive = signal<'nombre' | 'unidad' | 'email' | 'n'>('nombre');
    sortDir = signal<'asc' | 'desc'>('asc');

    displayed: string[] = ['nombre', 'unidad', 'email', 'n', 'acciones'];

    // 🧠 params reactivos -> observable
    private paramsSig = computed(() => ({
        q: this.q().trim() || null,
        unidad_medica_id: this.unidadSel()?.id ?? null,
        page: this.pageIndex() + 1,
        pageSize: this.pageSize()
    }));
    private params$ = toObservable(this.paramsSig, { injector: this.injector });
    private unidadTerm$ = toObservable(this.unidadTerm, { injector: this.injector });

    // filas ordenadas (cliente)
    rows = computed(() => {
        const data = [...this.items()];
        const active = this.sortActive();
        const dir = this.sortDir();
        const mul = dir === 'asc' ? 1 : -1;
        const S = (v?: string | null) => (v ?? '').toLocaleUpperCase();

        return data.sort((a, b) => {
            let va: string | number = '';
            let vb: string | number = '';
            switch (active) {
                case 'nombre': va = S(a.nombre_completo); vb = S(b.nombre_completo); break;
                case 'unidad': va = S(a.unidad_medica); vb = S(b.unidad_medica); break;
                case 'email': va = S(a.email_principal); vb = S(b.email_principal); break;
                case 'n': va = a.n_correos ?? 0; vb = b.n_correos ?? 0; break;
            }
            if (va < vb) return -1 * mul;
            if (va > vb) return 1 * mul;
            return 0;
        });
    });

    trackRow = (_: number, r: PersonaLite) => r.id;

    $onDestroy = new Subject<void>();
    ngOnDestroy(): void { this.$onDestroy.next(); this.$onDestroy.complete(); }

    ngOnInit(): void {
        // 🔄 Carga principal con cancelación automática y cancelación de previas (switchMap)
        this.params$
            .pipe(
                tap(() => this.loading.set(true)),
                switchMap(p =>
                    this.catalogoService.personas(p).pipe(
                        finalize(() => this.loading.set(false))
                    )
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (r: Page<PersonaLite>) => {
                    this.items.set(r.items ?? []);
                    this.total.set(r.total ?? 0);
                },
                error: () => {
                    this.items.set([]); this.total.set(0);
                    this.snack.open('No se pudieron cargar personas', 'Cerrar', { duration: 2000 });
                }
            });

        // 🔎 Autocomplete de unidad (debounce + cancelación + takeUntilDestroyed)
        this.unidadTerm$
            .pipe(
                debounceTime(250),
                distinctUntilChanged(),
                switchMap(term =>
                    this.catalogoService.unidades({ q: (term || '').trim() || null, page: 1, pageSize: 20 })
                ),
                map(r => r.items ?? []),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(items => this.unidadOpts.set(items));
    }

    // ↩️ Reset de página cuando cambian filtros base
    private _resetPageOnFilter = effect(() => {
        this.q(); this.unidadSel();
        this.pageIndex.set(0);
    }, { injector: this.injector });

    // sort handler
    onSort(e: Sort) {
        this.sortActive.set(((e.active || 'nombre') as any));
        this.sortDir.set(((e.direction || 'asc') as any));
    }

    // búsqueda por texto
    onSearchInput(ev: Event) {
        const val = (ev.target as HTMLInputElement)?.value ?? '';
        this.q.set(val);
    }
    clearSearch() { this.q.set(''); }

    // autocomplete de unidad
    onUnidadInput(ev: Event) {
        const val = (ev.target as HTMLInputElement)?.value ?? '';
        this.unidadTerm.set(val);
        this.unidadSel.set(null); // romper selección previa si teclean
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

    // paginación
    onPage(e: PageEvent) {
        this.pageIndex.set(e.pageIndex);
        this.pageSize.set(e.pageSize);
    }

    // acciones
    add() {
        this.dialog.open(PersonaDialog, {
            width: '640px',
            maxWidth: '98vw',
            data: { mode: 'create', value: { nombre_completo: '', unidad_medica_id: this.unidadSel()?.id ?? null } }
        }).afterClosed().subscribe(ok => {
            if (ok) {
                this.snack.open('Persona creada', 'Cerrar', { duration: 1800 });
                this.pageIndex.set(0);
            }
        });
    }

    edit(row: PersonaLite) {
        this.dialog.open(PersonaDialog, {
            width: '640px',
            maxWidth: '98vw',
            data: {
                mode: 'edit',
                value: {
                    id: row.id,
                    nombre_completo: row.nombre_completo,
                    unidad_medica_id: row.unidad_medica_id ?? null,
                    unidad_label: row.unidad_medica || null
                } as any
            }
        }).afterClosed().subscribe(ok => {
            if (ok) {
                this.snack.open('Persona actualizada', 'Cerrar', { duration: 1800 });
                this.pageIndex.set(this.pageIndex()); // refresh
            }
        });
    }

    remove(row: PersonaLite) {
        this.dialog.open(ConfirmDialog, {
            data: {
                title: 'Eliminar persona',
                message: `¿Seguro que deseas eliminar a "${row.nombre_completo}"? (borrado lógico)`
            }
        }).afterClosed().subscribe(ok => {
            if (!ok) return;
            this.personaService.remove(row.id).subscribe({
                next: _ => {
                    this.snack.open('Persona eliminada', 'Cerrar', { duration: 1800 });
                    const pageHasMore = (this.items().length > 1);
                    this.pageIndex.set(pageHasMore ? this.pageIndex() : Math.max(this.pageIndex() - 1, 0));
                },
                error: _ => this.snack.open('No se pudo eliminar', 'Cerrar', { duration: 2200 })
            });
        });
    }
}
