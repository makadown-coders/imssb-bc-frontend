# SSO Sandbox (Angular 19)

App de ejemplo para probar el SSO, el theming y el shell base (toolbar + sidenav + árbol + menú de usuario).
Usa las libs compartidas: `@imssb-bc/auth-core` y `@imssb-bc/auth-ui`.

## 🚀 Arranque rápido

```bash
# desde la raíz del workspace
ng build auth-core
ng build auth-ui
ng serve sso-sandbox
````

> El sandbox depende de las libs. Si editas `auth-core`/`auth-ui` seguido, puedes usar `ng build <lib> --watch` en otra terminal.

## ⚙️ Configuración de Auth

El sandbox consume el backend SSO (Node/Express) vía `@imssb-bc/auth-core`.

En `main.ts` (o `app.config.ts`) provee `HttpClient + Interceptor` y el config:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuthConfig, authInterceptor } from '@imssb-bc/auth-core';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAuthConfig({
      baseUrl: 'https://tu-backend',
      // opcionalmente puedes ajustar:
      // loginPath:'/api/auth/login', refreshPath:'/api/auth/refresh',
      // mePath:'/api/auth/me',       logoutPath:'/api/auth/logout',
    }),
  ],
});
```

### Rutas

```ts
// projects/sso-sandbox/src/app/app.routes.ts
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
      { path: 'welcome', loadComponent: () => import('./welcome.page').then(m => m.WelcomePage) },
    ],
  },
  { path: '**', redirectTo: '' }
];
```

## 🎨 Theming & Brand

El sandbox **no** define estilos sueltos: hereda el tema global centralizado en `styles/_brand.scss`.

En `projects/sso-sandbox/src/styles.scss`:

```scss
@use '../../../styles/brand' as brand;
@include brand.install-brand(); // instala tema light/dark + tokens + componentes
```

### Modo claro/oscuro

En la toolbar hay un **switch sol/luna** (mat-slide-toggle) que alterna la clase `dark-theme` en `<body>`.
Los colores del switch y del menú se controlan con variables CSS mapeadas en el brand.

## 🧭 Shell (layout)

* **Toolbar** con:

  * botón para colapsar el sidenav (mini-variant),
  * switch de tema (sol/luna),
  * menú de usuario (nombre desde `SessionStore` y acciones `Perfil`/`Cerrar sesión`).
* **Sidenav** colapsable con **API nueva** de `mat-tree` (`[childrenAccessor]`).
* **Ajuste de márgenes** del contenido con `mat-sidenav-container autosize` + `updateContentMargins()` al colapsar.

> Si notas “saltos” al colapsar, revisa que el container tenga `autosize` y que en el botón se llame al método que invoca `updateContentMargins()`.

## 🔐 Autenticación

* `authGuard` deja pasar si hay access o intenta `refresh()` con el refresh token del `TokenStore`.
* El **login** usa `<imssb-login-form>` de `@imssb-bc/auth-ui`:

  * Guarda tokens,
  * hidrata `/me` con `SessionStore.hydrate()`,
  * y navega a `redirectTo` (ej. `/dash`) o emite `(loggedIn)` para que la página decida.
* `logout()` en la toolbar llama a `AuthClient.logout()` (revoca en backend si hay refresh y limpia local siempre).

## 🗂️ Estructura relevante

```
projects/sso-sandbox/
├─ src/
│  ├─ app/
│  │  ├─ app.routes.ts
│  │  ├─ shell.component.{ts,html}     # toolbar + sidenav + árbol
│  │  ├─ login.page.ts                  # usa <imssb-login-form>
│  │  ├─ dashboard.page.{ts,html}       # ejemplo de tarjetas .surface-card
│  │  └─ welcome.page.{ts,html}
│  └─ styles.scss                       # instala el brand global
└─ public/                              # assets del sandbox
```

## 🧪 Pruebas y útiles

```bash
# servir
ng serve sso-sandbox

# compilar para prod
ng build sso-sandbox
```

## ✅ Checklist rápido

* [ ] `provideAuthConfig` apunta al backend correcto (CORS OK).
* [ ] `provideHttpClient(withInterceptors([authInterceptor]))` está configurado.
* [ ] `TokenStore` persiste en `localStorage` (F5 no debe patearte a login).
* [ ] El brand está importado en `styles.scss` y se ve el tema.
* [ ] Sidenav colapsa y el contenido se reajusta (autosize + updateContentMargins).
* [ ] Menú de usuario tiene fondo consistente (tokens del menú en el brand).

## 🧯 Troubleshooting

* **Al recargar /dash me regresa a /login** → El guard debe intentar `refresh()` si no hay access; y los tokens deben estar en `localStorage`.
* **Menú usuario con fondo “gris/transparente” raro** → revisa en el brand los tokens del menú (`--mat-menu-container-color`, `--menu-bg`, `--menu-fg`) y estilos del panel `.mat-mdc-menu-panel`.
* **Árbol con deprecaciones** → usar `[childrenAccessor]` y `#tree.isExpanded(node)` (ya aplicado).
* **Íconos no visibles** → asegura la fuente de Material Symbols en `index.html`.

---


