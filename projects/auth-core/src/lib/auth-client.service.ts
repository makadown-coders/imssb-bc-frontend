import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AUTH_CONFIG } from './auth.config';
import { TokenStore } from './token-store.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthClient {
    private http = inject(HttpClient);
    private cfg = inject(AUTH_CONFIG);
    private store = inject(TokenStore);

    private url(p: string, d: string) { return `${this.cfg.baseUrl}${p || d}`; }

    async login(email: string, password: string) {
        const res = await this.http.post<any>(
            this.url((this.cfg as any).loginPath, '/api/auth/login'),
            { email, password }
        ).toPromise();
        this.store.setTokens(res?.access_token, res?.refresh_token);
        return res;
    }

    async me() {
        return await this.http.get<any>(this.url((this.cfg as any).mePath, '/api/auth/me')).toPromise();
    }

    async refresh() {
        const rt = this.store.refresh;
        if (!rt) throw new Error('no refresh_token');
        const res = await firstValueFrom(this.http.post<any>(
            this.url((this.cfg as any).refreshPath, '/api/auth/refresh'),
            { refresh_token: rt }
        ));
        this.store.setTokens(res?.access_token, res?.refresh_token);
        return res;
    }

    logoutLocal() { this.store.setTokens(undefined, undefined); }
}

export { TokenStore };
