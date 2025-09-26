// projects/auth-core/src/lib/auth.interceptor.ts
import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStore } from './token-store.service';
import { AuthClient } from './auth-client.service';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

/**
 * Interceptor para agregar Authorization a las peticiones si hay access token.
 * Si la petición fallida con 401, intenta refrescar el access token con el refresh token.
 * Si el refresh también falla, propagamos el error original.
 * @returns {Observable<any>} Observable con la respuesta de la petición o el error si falla.
 */
export const AuthInterceptor: HttpInterceptorFn = (req, next): Observable<any> => {
  const store = inject(TokenStore);
  const client = inject(AuthClient);

  // 1) Adjunta Authorization si hay access token
  const at = store.access;
  const authReq = at ? req.clone({ setHeaders: { Authorization: `Bearer ${at}` } }) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // 2) Solo intentamos refresh si es 401 y tenemos refresh token
      if (err.status === 401 && store.refresh) {
        // Evita loop: si la petición fallida era al endpoint de refresh, no intentes refrescar otra vez
        const isRefreshCall =
          authReq.url.includes('/api/auth/refresh') ||
          authReq.url.includes('/api/auth/login');
        if (isRefreshCall) {
          return throwError(() => err);
        }

        // 3) Intenta refresh (AuthClient.refresh() devuelve Promise -> lo convertimos a Observable con `from`)
        return from(client.refresh()).pipe(
          // 4) Si refresh ok, reintenta la request original con el nuevo access token
          switchMap(() => {
            const newAt = store.access;
            const retryReq = newAt
              ? req.clone({ setHeaders: { Authorization: `Bearer ${newAt}` } })
              : req;
            return next(retryReq);
          }),
          // 5) Si el refresh también falla, propagamos el 401 original
          catchError(() => throwError(() => err))
        );
      }

      // No es 401 o no hay refresh: propagamos el error
      return throwError(() => err);
    })
  );
};
