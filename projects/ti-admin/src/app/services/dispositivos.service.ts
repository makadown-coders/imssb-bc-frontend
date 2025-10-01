import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { DispositivoRow } from "../models/DispositivoRow";
import { RuntimeConfigService } from "./runtime-config.service";
import { DispositivoDetail, Page } from "../models";
import { DispositivoRowEx } from "../models/DispositivoRowEx";

@Injectable({ providedIn: 'root' })
export class DispositivosService {
  private http = inject(HttpClient);
  private rc = inject(RuntimeConfigService);
  private get base() { return this.rc.apiUrl ?? ''; }

  list(opts: {
    unidad_medica_id?: number | null;
    tipo_dispositivo_id?: number | null;
    estado_dispositivo_id?: number | null;
    q?: string | null;
    page?: number;
    pageSize?: number;
  }): Observable<Page<DispositivoRowEx>> {
    let p = new HttpParams()
      .set('page', String(opts.page ?? 1))
      .set('pageSize', String(opts.pageSize ?? 20));
    if (opts.unidad_medica_id) p = p.set('unidad_medica_id', String(opts.unidad_medica_id));
    if (opts.tipo_dispositivo_id) p = p.set('tipo_dispositivo_id', String(opts.tipo_dispositivo_id));
    if (opts.estado_dispositivo_id) p = p.set('estado_dispositivo_id', String(opts.estado_dispositivo_id));
    if (opts.q?.trim()) p = p.set('q', opts.q.trim());

    return this.http.get<Page<DispositivoRowEx>>(`${this.base}/api/dispositivos`, { params: p });
  }

  getById(id: number) {
    return this.http.get<DispositivoDetail>(`${this.base}/api/dispositivos/${id}`);
  }
}