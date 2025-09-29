// projects/ti-admin/src/app/pages/catalogos.page.ts
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Material
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CatalogosService } from '../services/catalogos.service';
import {
    EstadoDispositivo,
    Localidad,
    Municipio,
    Page,
    TipoDispositivo,
    TipoUnidad,
    UnidadMedica
} from '../models';


@Component({
  standalone: true,
  selector: 'ti-catalogos-page',
  imports: [
    CommonModule, FormsModule,
    MatTabsModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatTableModule, MatPaginatorModule, MatIconModule, MatButtonModule,
    MatTooltipModule, MatDividerModule, MatProgressSpinnerModule
  ],
  templateUrl: './catalogos.page.html'
})
export class CatalogosPage implements OnInit {
  private api = inject(CatalogosService);

  // Data catálogos
  municipios = signal<Municipio[]>([]);
  localidades = signal<Localidad[]>([]);
  tiposUnidad = signal<TipoUnidad[]>([]);
  tiposDispositivo = signal<TipoDispositivo[]>([]);
  estadosDispositivo = signal<EstadoDispositivo[]>([]);

  // Filtros Unidades
  fMunicipio = signal<number|undefined>(undefined);
  fLocalidad = signal<number|undefined>(undefined);
  fTipoUnidad = signal<number|undefined>(undefined);
  q = signal<string>('');

  // Grid Unidades (paginado)
  pageIndex = signal(0);
  pageSize = signal(20);
  total = signal(0);
  unidades = signal<UnidadMedica[]>([]);
  displayedUnidades = ['id','nombre','cluessa','cluesimb','tipo','municipio','localidad'];

  // Loading flags
  loadingUnidades = signal(false);

  ngOnInit(): void {
    this.api.municipios().subscribe(r => this.municipios.set(r));
    this.api.tiposUnidad().subscribe(r => this.tiposUnidad.set(r));
    this.api.tiposDispositivo().subscribe(r => this.tiposDispositivo.set(r));
    this.api.estadosDispositivo().subscribe(r => this.estadosDispositivo.set(r));

    // Cargar localidades cuando cambia municipio
    effect(() => {
      const mid = this.fMunicipio();
      this.localidades.set([]);
      this.fLocalidad.set(undefined);
      this.api.localidades(mid ?? null).subscribe(r => this.localidades.set(r));
      this.reloadUnidades(true);
    });

    // Refrescar unidades si cambian filtros q / tipo / localidad
    effect(() => {
      // lee para reaccionar
      this.fLocalidad(); this.fTipoUnidad(); this.q();
      // debounce simple (micro) para búsquedas rápidas
      queueMicrotask(() => this.reloadUnidades(true));
    });
  }

  onPage(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.reloadUnidades(false);
  }

  clearFilters() {
    this.fMunicipio.set(undefined);
    this.fLocalidad.set(undefined);
    this.fTipoUnidad.set(undefined);
    this.q.set('');
    this.pageIndex.set(0);
    this.reloadUnidades(true);
  }

  private reloadUnidades(resetPage: boolean) {
    if (resetPage) this.pageIndex.set(0);
    this.loadingUnidades.set(true);
    const req = {
      municipio_id: this.fMunicipio(),
      localidad_id: this.fLocalidad(),
      tipo_unidad_id: this.fTipoUnidad(),
      q: this.q().trim() || null,
      page: this.pageIndex() + 1,
      pageSize: this.pageSize(),
    };
    this.api.unidades(req).subscribe({
      next: (r: Page<UnidadMedica>) => {
        this.unidades.set(r.items ?? []);
        this.total.set(r.total ?? 0);
      },
      error: () => { this.unidades.set([]); this.total.set(0); },
      complete: () => this.loadingUnidades.set(false)
    });
  }

    buscarUnidades($event: any) {
      this.q.set(($event.target as HTMLInputElement).value)
    }
}
