import { Routes } from '@angular/router';
import { AuthGuard } from '@imssb-bc/auth-core'; // ajustar si el guard exporta otro nombre

export const routes: Routes = [
  // Login público
  { path: 'login', loadComponent: () => import('./login.page').then(m => m.LoginPage) },

  // Área autenticada con Shell (toolbar + sidenav)
  {
    path: 'ti',
    canActivate: [AuthGuard],
    loadComponent: () => import('./shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inventario' }, // redirect desde /ti
      { path: 'inventario', loadComponent: () => import('./pages/inventario.page').then(m => m.InventarioPage) },
      { path: 'asignaciones', loadComponent: () => import('./pages/placeholder-asignaciones').then(m => m.AsignacionesPage) },
      { path: 'ajustes', loadComponent: () => import('./pages/placeholder-ajustes').then(m => m.AjustesPage) },
    ]
  },

  { path: '**', redirectTo: 'ti' }
];
