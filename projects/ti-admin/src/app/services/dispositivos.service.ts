import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { DispositivoRow } from "../models/DispositivoRow";
import { RuntimeConfigService } from "./runtime-config.service";

@Injectable({ providedIn: 'root' })
export class DispositivosService {
  private http = inject(HttpClient);
  private rc = inject(RuntimeConfigService);
  private get base() { return this.rc.apiUrl ?? ''; }

  list(opts: {
    unidad_medica_id?: number | null;
    tipo_dispositivo_id?: number | null;
    q?: string | null;
    page?: number;         // opcional: si luego haces server-side paging
    pageSize?: number;     // idem
  }): Observable<DispositivoRow[]> {
    let p = new HttpParams();
    if (opts.unidad_medica_id)   p = p.set('unidad_medica_id', String(opts.unidad_medica_id));
    if (opts.tipo_dispositivo_id)p = p.set('tipo_dispositivo_id', String(opts.tipo_dispositivo_id));
    if (opts.q?.trim())          p = p.set('q', opts.q.trim());
    // por ahora el backend devuelve array; si luego agregas total, usamos page/pageSize
    return this.http.get<DispositivoRow[]>(`${this.base}/api/dispositivos`, { params: p });
  }
}