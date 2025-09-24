import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { TokenStore } from './token-store.service';
import { jwtDecode } from 'jwt-decode';

type Role = { code: string; scope_type?: string; scope_id?: string | null };

export function roleGuard(required: string): CanActivateFn {
  return () => {
    const store = inject(TokenStore);
    if (!store.access) return false;
    const payload: any = jwtDecode(store.access);
    const roles: Role[] = payload?.roles || [];
    return roles.some(r => r.code === required);
  };
}
