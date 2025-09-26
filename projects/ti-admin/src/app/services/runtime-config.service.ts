import { Injectable } from '@angular/core';

export interface RuntimeConfig { API_URL?: string; }

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private cfg: RuntimeConfig = {};

  async load(): Promise<void> {
    try {
      const res = await fetch('/env.json', { cache: 'no-store' });
      if (res.ok) this.cfg = await res.json();
    } catch {
      this.cfg = {};
    }
  }

  get apiUrl(): string | undefined {
    return this.cfg.API_URL;
  }
}
