// projects/ti-admin/src/app/services/catalogos.service.ts
import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, catchError, map, of } from "rxjs";
import { EstadoDispositivo } from "../models/EstadoDispositivo";
import { Localidad } from "../models/Localidad";
import { Municipio } from "../models/Municipio";
import { Page } from "../models/Page";
import { TipoDispositivo } from "../models/TipoDispositivo";
import { TipoUnidad } from "../models/TipoUnidad";
import { UnidadMedica } from "../models/UnidadMedica";
import { RuntimeConfigService } from "./runtime-config.service";
import { TipoPeriferico } from "../models/TipoPeriferico";

@Injectable({ providedIn: 'root' })
export class CatalogosService {
    private http = inject(HttpClient);
    private rc = inject(RuntimeConfigService);
    private get base() { return this.rc.apiUrl ?? ''; }

    // Catálogos “core”
    municipios(): Observable<Municipio[]> {
        return this.http.get<Municipio[]>(`${this.base}/api/catalogos/municipios`);
    }
    localidades(municipio_id?: number | null): Observable<Localidad[]> {
        const q = municipio_id ? `?municipio_id=${municipio_id}` : '';
        return this.http.get<Localidad[]>(`${this.base}/api/catalogos/localidades${q}`);
    }
    tiposUnidad(): Observable<TipoUnidad[]> {
        return this.http.get<TipoUnidad[]>(`${this.base}/api/catalogos/tipos-unidad`);
    }
    tiposDispositivo(): Observable<TipoDispositivo[]> {
        return this.http.get<TipoDispositivo[]>(`${this.base}/api/catalogos/tipos-dispositivo`);
    }
    estadosDispositivo(): Observable<EstadoDispositivo[]> {
        return this.http.get<EstadoDispositivo[]>(`${this.base}/api/catalogos/estados-dispositivo`);
    }

    // Búsqueda TI de unidades (ruta nueva que definimos en backend)
    // GET /api/ti/unidades?municipio_id=&localidad_id=&tipo_unidad_id=&q=&page=&pageSize=
    unidades(opts: {
        municipio_id?: number | null;
        localidad_id?: number | null;
        tipo_unidad_id?: number | null;
        q?: string | null;
        page?: number;
        pageSize?: number;
    }): Observable<Page<UnidadMedica>> {
        const p = new URLSearchParams();
        if (opts.municipio_id) p.set('municipio_id', String(opts.municipio_id));
        if (opts.localidad_id) p.set('localidad_id', String(opts.localidad_id));
        if (opts.tipo_unidad_id) p.set('tipo_unidad_id', String(opts.tipo_unidad_id));
        if (opts.q?.trim()) p.set('q', opts.q.trim());
        p.set('page', String(opts.page ?? 1));
        p.set('pageSize', String(opts.pageSize ?? 20));
        return this.http.get<Page<UnidadMedica>>(`${this.base}/api/ti/unidades?${p.toString()}`)
            .pipe(map(r => ({ ...r, items: r.items ?? [] })));
    }

    /** Tipos de periférico: hoy puede ser fallback estático; mañana, API real */
    tiposPeriferico() {
        return this.http.get<TipoPeriferico[]>(`${this.base}/api/catalogos/tipos-periferico`).pipe(
            catchError(() =>
                of([]) // fallback vacío
                // of(['MOUSE', 'TECLADO', 'CAMARA', 'MICROFONO', 'HEADSET'])) // fallback
            ));
    }

    /** Opcional: si prefieres SelectOpt para ligarlo a mat-select con label/value */
    tiposPerifericoOpts() {
        return this.tiposPeriferico().pipe(
            map(arr => arr.map(n => ({ value: n, label: n })))
        );
    }
    personas(opts: { q?: string | null; page?: number; pageSize?: number }) {
        const p = new URLSearchParams();
        if (opts.q?.trim()) p.set('q', opts.q.trim());
        p.set('page', String(opts.page ?? 1));
        p.set('pageSize', String(opts.pageSize ?? 20));
        return this.http.get<{ items: { id: number; nombre_completo: string; unidad_medica?: string }[], page: number, pageSize: number, total: number }>(
            `${this.base}/api/ti/personas?${p.toString()}`
        );
    }
}