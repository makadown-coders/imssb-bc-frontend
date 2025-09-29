// projects/ti-admin/src/app/shell.component.ts
import { Component, inject, signal, ViewChild } from '@angular/core';
import { Router, IsActiveMatchOptions, RouterModule } from '@angular/router';

// Material
import { MatSidenavContainer, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { AuthClient, SessionStore } from '@imssb-bc/auth-core';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { applyTheme, persistTheme, ThemeMode } from './shared/theme.utils';


type NavNode = { name: string; icon?: string; route?: string; children?: NavNode[] };

const NAV_DATA: NavNode[] = [
  { name: 'Inventario', icon: 'inventory_2', route: '/ti/inventario' },
  { name: 'Asignaciones', icon: 'assignment_ind', route: '/ti/asignaciones' },
  { name: 'Ajustes', icon: 'tune', route: '/ti/ajustes' },
];

@Component({
  selector: 'ti-shell',
  standalone: true,
  imports: [
    RouterModule,
    MatSidenavModule, MatToolbarModule,
    MatTreeModule, MatMenuModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatSlideToggleModule
  ],
  templateUrl: './shell.component.html',
  styleUrls: []
})
export class ShellComponent {
  logoSrc = 'imssb-logo.svg';
  @ViewChild(MatSidenavContainer) container!: MatSidenavContainer;
  router = inject(Router);
  auth = inject(AuthClient);
  session = inject(SessionStore);
  /** Opciones recomendadas para “activo” en elementos de menú */
  private readonly activeSubset: IsActiveMatchOptions = {
    // matching de ruta parcial para que /ti/ajustes también marque activo en /ti/ajustes?tab=...
    paths: 'subset',
    queryParams: 'subset',
    fragment: 'ignored',
    matrixParams: 'ignored',
  };

  // Mini-variant (icon-only)
  collapsed = signal(false);

  // Tema
  theme = signal<'claro' | 'oscuro'>(document.body.classList.contains('dark-theme') ? 'oscuro' : 'claro');
  isDark() {
    return document.body.classList.contains('dark-theme');
  }

  constructor() {
    // Asegura que haya perfil al entrar (si ya hay token)
    this.session.hydrate();
  }

  onThemeToggle(checked: boolean) {
    const next: ThemeMode = checked ? 'oscuro' : 'claro';
    this.theme.set(next);
    applyTheme(next);        // aplica clase en <body>
    persistTheme(next);      // guarda en localStorage "TI-theme"
    queueMicrotask(() => this.container.updateContentMargins?.());
  }

  // Árbol (API nueva)
  dataSource: NavNode[] = NAV_DATA;
  childrenAccessor = (node: NavNode) => node.children ?? [];
  hasChild = (_: number, node: NavNode) => !!node.children?.length;

  // Navegación
  go(node: NavNode) {
    if (!node.route) return;
    this.router.navigateByUrl(node.route);
  }
  isActive(node: NavNode) {
    if (!node.route) return false;
    // Construye UrlTree desde la ruta (usa parseUrl para rutas absolutas)
    const tree = node.route.startsWith('/')
      ? this.router.parseUrl(node.route)
      : this.router.createUrlTree([node.route]);
    return this.router.isActive(tree, this.activeSubset);
    // return node.route ? this.router.isActive(node.route, false) : false;
  }


  initials(): string {
    const n = this.session.user()?.name || '';
    const parts = n.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() ?? '').join('');
  }

  goProfile() { this.router.navigateByUrl('/settings'); }
  async logout() {
    await this.auth.logout();  // revoca + limpia local
    this.router.navigateByUrl('/login');
  }

  toggleCollapse() {
    this.collapsed.update(v => !v);

    // Deja que el ancho nuevo “asiente” y luego recalcula márgenes:
    // autosize ayuda, pero esto lo hace inmediato y suave.
    queueMicrotask(() => this.container.updateContentMargins?.());
  }
}
