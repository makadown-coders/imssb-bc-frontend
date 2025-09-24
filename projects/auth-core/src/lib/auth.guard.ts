import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenStore } from './token-store.service';

export const authGuard: CanActivateFn = () => {
  const store = inject(TokenStore);
  const router = inject(Router);
  if (store.access) return true;
  router.navigate(['/login']);  // tu ruta de login de la app
  return false;
};
