# `@imssb-bc/auth-core`

Cliente de autenticación para Angular 19 que centraliza:

* **Tokens** (persistentes)
* **Llamadas** a `/api/auth/*` (login, refresh, me, logout)
* **Guard** para rutas protegidas
* **Interceptor** HTTP (Bearer + retry con refresh)
* **Store de sesión** (perfil `/me`)

Funciona con el backend Node/Express (SSO local con JWT RS256 + refresh rotatorio).

---

## (arranque rápido)

```ts
// main.ts (o app.config.ts)
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuthConfig, authInterceptor } from '@imssb-bc/auth-core';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAuthConfig({
      baseUrl: 'https://tu-backend',
      loginPath:   '/api/auth/login',
      refreshPath: '/api/auth/refresh',
      mePath:      '/api/auth/me',
      logoutPath:  '/api/auth/logout',
    }),
  ],
});
```

```ts
// app.routes.ts (zona protegida con Shell)
import { Routes } from '@angular/router';
import { authGuard } from '@imssb-bc/auth-core';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login.page').then(m => m.LoginPage) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dash' },
      { path: 'dash', loadComponent: () => import('./dashboard.page').then(m => m.DashboardPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
```

---

## Instalación

Monorepo Angular (workspace):

```bash
# (ya existe en projects/auth-core)
ng build auth-core
```

En apps del workspace: importa lo que necesites desde `@imssb-bc/auth-core`.

---

## Configuración

Se provee vía `AUTH_CONFIG`:

```ts
import { InjectionToken, Provider } from '@angular/core';

export interface AuthConfig {
  baseUrl: string;           // ej. https://koyeb.app
  loginPath?: string;        // default: /api/auth/login
  refreshPath?: string;      // default: /api/auth/refresh
  mePath?: string;           // default: /api/auth/me
  logoutPath?: string;       // default: /api/auth/logout
}

export const provideAuthConfig = (cfg: AuthConfig): Provider => ({
  provide: AUTH_CONFIG,
  useValue: cfg,
});
```

> Si omites los `*Path`, se usan los defaults.

---

## API (superficie pública)

La librería expone:

* `AuthClient` – Llama al backend y gestiona tokens.
* `TokenStore` – Persiste y publica `access`/`refresh`.
* `SessionStore` – Señales con `user`, `hydrate()`, `clear()`.
* `authGuard` – Protege rutas (intenta refresh silencioso).
* `authInterceptor` – Agrega Bearer y, ante 401, intenta 1 refresh y reintento.
* `AUTH_CONFIG` / `provideAuthConfig`.

### `AuthClient`

```ts
login(email: string, password: string): Promise<any>
refresh(): Promise<any>
me(): Promise<any>
logout(): Promise<void>         // POST /logout con refresh_token + limpia local
logoutLocal(): void            // solo limpia local (sin red)
```

* `login` guarda tokens en `TokenStore`.
* `refresh` usa `refresh_token` del store, guarda el nuevo par.
* `me` obtiene `{ profile: { id, email, name, ... } }` (contrato backend).
* `logout` intenta revocar en backend (si hay refresh) y **siempre** limpia local.

### `TokenStore`

Persistente en `localStorage` (clave `imssb.auth.*`).

```ts
get access: string | null
get refresh: string | null
set(access?: string|null, refresh?: string|null): void
clear(): void
```

> **F5 friendly**: al construir el store, lee localStorage; no dependes de async.

### `SessionStore`

Señales para el perfil del usuario (opcional para UI).

```ts
user = signal<UserProfile | null>(null)
loading = signal(false)
error = signal<string | null>(null)

hydrate(): Promise<void>  // GET /me (si hay access)
setUser(u: UserProfile | null): void
clear(): void
```

> Úsalo en toolbar para mostrar nombre/email, o bien setea `user` con la respuesta de `login` si la expones en backend.

### `authGuard`

* Si hay **access**, deja pasar.
* Si no hay, pero hay **refresh**, llama `auth.refresh()`; si ok, pasa.
* Si falla, redirige a `/login?returnUrl=<ruta>`.

### `authInterceptor`

* Adjunta `Authorization: Bearer <access>` si existe.
* Si la respuesta es **401** y hay refresh, hace **un** intento de `refresh()` y repite la petición una sola vez.
* Si vuelve a fallar, propaga el error.

---

## Flujo típico

1. Usuario abre una ruta protegida → `authGuard` deja pasar si hay access o intenta refresh.
2. Tu Shell (protegido) llama `session.hydrate()` para mostrar nombre/email.
3. En `login`, `AuthClient.login()` guarda tokens; puedes:

   * redirigir a `returnUrl` (si venías redirigido), o a `/dash`, y
   * llamar `session.hydrate()` para que la UI muestre el nombre al instante.
4. `logout()` revoca en backend y siempre limpia local; redirige a `/login`.

---

## Ejemplos

### Proveer HttpClient + Interceptor + Config

```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuthConfig, authInterceptor } from '@imssb-bc/auth-core';

providers: [
  provideHttpClient(withInterceptors([authInterceptor])),
  provideAuthConfig({ baseUrl: 'https://mi-backend' }),
]
```

### Rutas protegidas

```ts
import { authGuard } from '@imssb-bc/auth-core';

{ path: '', canActivate: [authGuard], loadComponent: ... }
```

### Mostrar nombre en toolbar (Shell)

```ts
import { Component, inject } from '@angular/core';
import { SessionStore } from '@imssb-bc/auth-core';

export class ShellComponent {
  session = inject(SessionStore);
  constructor() { this.session.hydrate(); }
}
```

```html
<button mat-button>
  <mat-icon>account_circle</mat-icon>
  {{ session.user()?.name || 'Usuario' }}
</button>
```

### Login (con `auth-ui`, opcional)

```html
<imssb-login-form nombreApp="SSO Sandbox" redirectTo="/dash"></imssb-login-form>
```

> El form llama `auth.login()`, guarda tokens y hace `session.hydrate()`.

---

## Contrato backend esperado

* `POST /api/auth/login` → `{ access_token, refresh_token, user? }`
* `POST /api/auth/refresh` → `{ access_token, refresh_token }`
* `GET  /api/auth/me` (Bearer access) → `{ profile: {...} }`
* `POST /api/auth/logout` `{ refresh_token }` → `{ ok: true }`

> Si tu `/login` devuelve `user`, puedes evitar `/me` en el primer render haciendo `session.setUser(user)`.

---

## Seguridad & buenas prácticas

* **Tokens en localStorage**: es práctico; evita XSS (lint, CSP, `DomSanitizer`, no `innerHTML` crudo).
* **TTL cortos**: `access` \~15 min, `refresh` \~14 días (como en backend).
* **Revocación**: `logout()` marca el refresh como `revoked`.
* **HTTPS** siempre (en producción).
* **Issuer allowlist** del backend alineado con tus dominios.

---

## Troubleshooting

* **F5 me manda a /login**

  * Verifica que `TokenStore` persiste tokens y que `authGuard` intenta `refresh()`.
* **401 después de expirar access**

  * Revisa que el **interceptor** esté registrado con `withInterceptors([authInterceptor])`.
* **`mat-form-field must contain a MatFormFieldControl`**

  * Falta `matInput`/`MatInputModule` o el input no está dentro de `<mat-form-field>`.
* **Logout no “sale”**

  * Usa `await auth.logout()` (revoca + limpia); si solo quieres limpiar rápido: `auth.logoutLocal()`.

---

## Roadmap (lib)

* Guards por **roles/scopes** leyendo `roles` del JWT.
* Endpoint `/me` ampliado (roles + scopes).
* Eventos globales (Subject) para cambios de sesión.

---

## Public API

```ts
/*
 * Public API Surface of auth-core
 */
export * from './lib/auth-core';           // (si tienes utilidades genéricas)
export * from './lib/auth.config';         // AUTH_CONFIG / provideAuthConfig
export * from './lib/session-store.service';
export * from './lib/token-store.service';
export * from './lib/auth-client.service';
export * from './lib/auth.interceptor';
export * from './lib/auth.guard';
export * from './lib/role.guard';          // (si lo usas)
```

---

