// projects/ti-admin/src/app/services/personas-api.service.ts
import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { RuntimeConfigService } from "./runtime-config.service";

@Injectable({ providedIn: 'root' })
export class PersonasApiService {
  private http = inject(HttpClient);
  private rc = inject(RuntimeConfigService);
  private get base() { return this.rc.apiUrl ?? ''; }

  create(body: { nombre_completo: string; unidad_medica_id?: number | null; correos?: string[] }) {
    return this.http.post<{ id: number }>(`${this.base}/api/ti/personas`, body);
  }
  update(id: number, body: { nombre_completo?: string; unidad_medica_id?: number | null; correos?: string[] }) {
    return this.http.put<{ id: number }>(`${this.base}/api/ti/personas/${id}`, body);
  }
  remove(id: number) {
    return this.http.delete<{ ok: boolean }>(`${this.base}/api/ti/personas/${id}`);
  }
}
