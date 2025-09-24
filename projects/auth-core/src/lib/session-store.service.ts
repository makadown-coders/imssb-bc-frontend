import { Injectable, signal } from '@angular/core';
import { AuthClient, TokenStore } from './auth-client.service'; // <-- ajusta el import según tu estructura
import { UserProfile } from './UserProfile';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  user    = signal<UserProfile | null>(null);
  loading = signal(false);
  error   = signal<string | null>(null);

  constructor(private auth: AuthClient, private tokens: TokenStore) {}

  /** Carga /me si hay access token */
  async hydrate(): Promise<void> {
    if (!this.tokens.access) return;
    if (this.user() || this.loading()) return;
    try {
      this.loading.set(true);
      const resp = await this.auth.me();               // GET /api/auth/me
      // resp esperado: { profile: { id, email, name, ... } }
      this.user.set(resp.profile);
      this.error.set(null);
    } catch (e: any) {
      this.error.set(e?.message || 'No se pudo obtener el perfil');
      this.user.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  /** Útil tras login: el backend ya regresa user */
  setUser(u: UserProfile | null) { this.user.set(u); }

  /** Limpia sesión local */
  clear() {
    this.user.set(null);
    this.tokens.clear(); // si tu TokenStore expone clear(); si no, bórralo del modo que tengas
  }
}
