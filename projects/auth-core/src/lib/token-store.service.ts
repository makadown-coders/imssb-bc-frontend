import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  private accessToken?: string;
  private refreshToken?: string;

  setTokens(a?: string, r?: string) { this.accessToken = a; this.refreshToken = r; }
  get access() { return this.accessToken; }
  get refresh() { return this.refreshToken; }

  // Opcional: si quieres persistir sesión de pestaña:
  // usa sessionStorage (no localStorage) y cifra si luego te animas
  clear() {
    this.accessToken = undefined;
    this.refreshToken = undefined;
  }
}
