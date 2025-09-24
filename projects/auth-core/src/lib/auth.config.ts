import { InjectionToken } from '@angular/core';

export interface AuthConfig {
  baseUrl: string;              // p.ej. https://xxxxx.koyeb.app
  loginPath?: string;           // default /api/auth/login
  refreshPath?: string;         // default /api/auth/refresh
  mePath?: string;              // default /api/auth/me
}

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');
