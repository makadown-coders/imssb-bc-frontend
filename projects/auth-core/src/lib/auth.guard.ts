import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenStore } from './token-store.service';
import { AuthClient } from './auth-client.service';

export const AuthGuard: CanActivateFn = async (_r, state) => {
  const tokens = inject(TokenStore);
  const auth = inject(AuthClient);
  const router = inject(Router);

  if (tokens.access) return true;

  if (tokens.refresh) {
    try { await auth.refresh(); return true; } catch { }
  }
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
