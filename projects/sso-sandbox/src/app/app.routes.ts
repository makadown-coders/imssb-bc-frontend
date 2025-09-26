import { Routes } from '@angular/router';
import { AuthGuard } from '@imssb-bc/auth-core';

export const routes: Routes = [
  // Login público
  { path: 'login', loadComponent: () => import('./login.page').then(m => m.LoginPage) },

  // Área autenticada con Shell (toolbar + sidenav)
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () => import('./shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dash' },

      // Dashboard de ejemplo
      { path: 'dash', loadComponent: () => import('./dashboard.page').then(m => m.DashboardPage) },

      // Tu página actual de bienvenida (si la quieres conservar)
      { path: 'welcome', loadComponent: () => import('./welcome.page').then(m => m.WelcomePage) },

      // futuros módulos/páginas
      // { path: 'orders', loadComponent: () => import('./orders.page').then(m => m.OrdersPage) },
      // { path: 'catalogs', loadComponent: () => import('./catalogs.page').then(m => m.CatalogsPage) },
      // { path: 'settings', loadComponent: () => import('./settings.page').then(m => m.SettingsPage) },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
