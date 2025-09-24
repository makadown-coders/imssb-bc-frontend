# README (raíz del workspace)

> Monorepo Angular 19 para SSO + apps IMSSB-BC
> Librerías compartidas: **auth-core** (cliente de auth, guard, interceptor, store) y **auth-ui** (componentes de UI como `<imssb-login-form>`).
> Sandbox de ejemplo: **sso-sandbox** (shell con toolbar/sidenav, menú usuario, árbol de navegación, dashboard demo).

## 📦 Estructura

```
/
├─ projects/
│  ├─ auth-core/         # Lógica de autenticación (TokenStore, AuthClient, Guard, Interceptor)
│  ├─ auth-ui/           # Componentes UI reutilizables (login-form, etc.)
│  └─ sso-sandbox/       # App de ejemplo (shell, dashboard, rutas protegidas)
├─ styles/
│  └─ _brand.scss        # Tema central (Material M3 + variables CSS + tokens)
├─ angular.json
├─ package.json
└─ tsconfig*.json
```

## ✅ Requisitos

* Node 20+
* Angular CLI 19+
* Backend Node/Express con SSO local (endpoints `/api/auth/*`) corriendo

## ⚙️ Variables de entorno (frontend)

La app usa un `AUTH_CONFIG` (InjectionToken) para apuntar al backend:

```ts
// Ejemplo de provider en main.ts o app.config.ts
provideAuthConfig({
  baseUrl: 'https://tu-backend',   // ej. Koyeb
  loginPath:   '/api/auth/login',
  refreshPath: '/api/auth/refresh',
  mePath:      '/api/auth/me',
  logoutPath:  '/api/auth/logout',
});
```

> Si no defines los `*Path`, el cliente usa los defaults anteriores.

## 🚀 Desarrollo

Instalar dependencias:

```bash
npm i
```

Compilar libs (primera vez o tras cambios en cada lib):

```bash
ng build auth-core
ng build auth-ui
```

Correr el sandbox:

```bash
ng serve sso-sandbox
```

> El sandbox depende de las libs. Si editas `auth-core`/`auth-ui` con frecuencia, puedes usar `ng build <lib> --watch` en otra terminal.

## 🎨 Theming & Brand

* El tema global está centralizado en **`styles/_brand.scss`**:

  * Define Material M3 con `mat.define-theme` (light/dark).
  * Expone **variables CSS** (ej. `--toolbar-bg`, `--nav-bg`, `--surface-1`, `--text-strong`…).
  * Personaliza componentes (toolbar, sidenav, cards, tablas, menús, inputs).
  * Soporta **modo oscuro** con `body.dark-theme`.

* El sandbox **no** lleva estilos sueltos; usa las clases utilitarias del brand:

  * `.brand-shell` (contenedor principal)
  * `.brand-sidenav` (+ mini-variant con `.collapsed`)
  * `.brand-content`
  * `.surface-card`, `.cards-grid`, `.brand-tree`, etc.

* **Switch sol/luna**: `mat-slide-toggle` mapeado a vars `--switch-*` en el brand.

## 🔐 Autenticación (resumen)

* **auth-core**

  * `TokenStore` (persistente en `localStorage`) con `set()/clear()`.
  * `AuthClient` (`login`, `refresh`, `me`, `logout`, `logoutLocal`).
  * `authGuard`: deja pasar si hay `access` o intenta `refresh` con `refresh_token`. Si no, redirige a `/login?returnUrl=<ruta>`.
  * `authInterceptor`: agrega Bearer y reintenta una vez con `refresh` ante 401.

* **auth-ui**

  * `<imssb-login-form>` emite `(loggedIn)` y opcionalmente navega con `[redirectTo]`.
  * Tras login, hace `session.hydrate()` para sacar `/me` y mostrar nombre/email en toolbar.

* **sso-sandbox**

  * Rutas:

    ```ts
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
    ```
  * Shell con **toolbar/sidenav**, **mat-menu** (usuario), **mat-tree** (API nueva con `childrenAccessor`), **mini-variant** colapsable y ajuste de márgenes con `autosize + updateContentMargins()`.

## 🧪 Comandos útiles

```bash
# Compilar libs
ng build auth-core
ng build auth-ui

# Servir el sandbox (dev)
ng serve sso-sandbox

# Pruebas unitarias (si aplican en cada proyecto)
ng test sso-sandbox
ng test auth-core
ng test auth-ui

# Lint (si configuraste eslint)
ng lint
```

## 🧱 Crear una nueva app en el workspace

```bash
ng g application apps/mi-app --style=scss --routing=true
# o simplemente:
ng g application mi-app --style=scss --routing=true
```

Luego:

1. Importa el **brand** en `styles.scss` de la app:

```scss
@use '../../../styles/brand' as brand;
@include brand.install-brand();
```

2. Configura rutas como en el sandbox (Shell protegido).
3. Usa `auth-core` y `auth-ui` como en el sandbox.

## ✅ Checklist para una pantalla protegida

* [ ] Define la ruta como **hija** del `ShellComponent` protegido por `authGuard`.
* [ ] Usa `.surface-card` para paneles.
* [ ] Si necesitas tabla: `MatTableModule + paginator + sort`, el brand ya lo estiliza.
* [ ] Evita estilos locales; si te falta un token/color, agrégalo al **brand**.

## 🧯 Troubleshooting común

* **F5 me saca a login** → asegura:

  * `TokenStore` persiste en `localStorage`.
  * `authGuard` intenta `refresh()` si no hay `access`.
  * Tras login, el `LoginForm` guarda tokens y el Shell hace `session.hydrate()`.

* **`mat-form-field must contain a MatFormFieldControl`** → faltan `matInput`/`MatInputModule` o el control no está dentro del `<mat-form-field>`.

* **Menú (`mat-menu`) con fondo extraño/transparente** → revisa en brand los tokens del menú:

  * `--mat-menu-container-color`, `--menu-bg`, `--menu-fg` y estilos del panel `.mat-mdc-menu-panel`.

* **Sidenav colapsa pero el contenido no se ajusta** → usa `autosize` en `mat-sidenav-container` y llama `container.updateContentMargins()` al togglear; o forzar con CSS el `margin-left` usando `--sidenav-width/--sidenav-mini`.

* **Árbol de navegación (deprecaciones)** → usar **API nueva** de `mat-tree` con `[childrenAccessor]` y `#tree.isExpanded(node)`.

* **SCSS de Material (errores de densidad/tipografía/paletas)** → en el brand:

  * `mat.define-theme((color:(theme-type: light|dark, primary: $primary, tertiary: $tertiary), density: (scale: 0)))`
  * Evita claves no soportadas (ej. `secondary` en M3).

* **Iconos que no aparecen (ej. ojo en password)** → usa `mat-icon` con `fontIcon="visibility"` / `visibility_off` y verifica `MatIconModule`/`material-icons` cargadas.

## 🗺️ Roadmap corto

* [ ] Publicar `auth-core` y `auth-ui` como paquetes internos (o vía `npm link`/`workspace:*`).
* [ ] Demo de `mat-tab-group` + `mat-menu` “Más” en toolbar.
* [ ] Guards por **roles** y **scopes** (leyendo `roles` del JWT).
* [ ] Componentes UI: `UserAvatar` con iniciales y menú contextual.
* [ ] Librería `shared-ui` para layouts comunes (tablas con filtros, chips, dialogs, etc.)

