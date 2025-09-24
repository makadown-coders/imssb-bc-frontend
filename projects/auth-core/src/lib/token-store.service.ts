import { Injectable, signal } from '@angular/core';

const K = (k: string) => `imssb.auth.${k}`;

@Injectable({ providedIn: 'root' })
export class TokenStore {
  private accessSig = signal<string | null>(this.read('access'));
  private refreshSig = signal<string | null>(this.read('refresh'));

  private read(key: 'access' | 'refresh') {
    try { return localStorage.getItem(K(key)); } catch { return null; }
  }
  private write(key: 'access' | 'refresh', val: string | null) {
    try {
      const kk = K(key);
      if (val) localStorage.setItem(kk, val);
      else localStorage.removeItem(kk);
    } catch { }
  }

  get access() { return this.accessSig(); }
  get refresh() { return this.refreshSig(); }

  /** Acepta string | null | undefined */
  set(access?: string | null, refresh?: string | null) {
    const a = access ?? null;
    const r = refresh ?? null;
    this.accessSig.set(a); this.write('access', a);
    this.refreshSig.set(r); this.write('refresh', r);
  }
  clear() {
    this.set(null, null);
  }
}
