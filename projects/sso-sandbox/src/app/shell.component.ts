import { Component, inject, signal, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavContainer, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTreeModule } from '@angular/material/tree';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AuthClient, SessionStore } from '@imssb-bc/auth-core';

type NavNode = { name: string; icon?: string; route?: string; children?: NavNode[] };

const NAV_DATA: NavNode[] = [
  { name: 'Dashboard', icon: 'dashboard', route: '/dash' },
  {
    name: 'Abasto', icon: 'inventory_2',
    children: [
      { name: 'Solicitudes', icon: 'assignment', route: '/orders' },
      { name: 'Existencias', icon: 'warehouse', route: '/stocks' },
    ]
  },
  {
    name: 'Recursos Materiales', icon: 'build',
    children: [
      { name: 'Dashboard', icon: 'analytics', route: '/rm-dash' },
      { name: 'Reportes', icon: 'summarize', route: '/rm-reports' },
    ]
  },
  {
    name: 'TI', icon: 'computer',
    children: [
      { name: 'Inventarios', icon: 'dns', route: '/ti-inv' },
      { name: 'Asignaciones', icon: 'person_add', route: '/ti-assign' },
    ]
  },
  { name: 'Ajustes', icon: 'settings', route: '/settings' },
];

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [
    RouterModule,
    MatSidenavModule, MatToolbarModule,
    MatTreeModule, MatMenuModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatSlideToggleModule
  ],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  @ViewChild(MatSidenavContainer) container!: MatSidenavContainer;
  router = inject(Router);
  auth = inject(AuthClient);
  session = inject(SessionStore);

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
    // checked = true ⇒ modo oscuro
    document.body.classList.toggle('dark-theme', checked);
    this.theme.set(checked ? 'oscuro' : 'claro');

    // si tienes el sidenav mini-variant con autosize, puedes
    // refrescar márgenes si lo necesitas:
    // queueMicrotask(() => this.container.updateContentMargins?.());
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
    return node.route ? this.router.isActive(node.route, false) : false;
  }


  initials(): string {
    const n = this.session.user()?.name || '';
    const parts = n.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() ?? '').join('');
  }

  goProfile() { this.router.navigateByUrl('/settings'); }
  async logout() {
    try { await this.auth.logoutLocal?.(); } catch { }
    this.session.clear();
    this.router.navigateByUrl('/login');
  }

  toggleCollapse() {
    this.collapsed.update(v => !v);

    // Deja que el ancho nuevo “asiente” y luego recalcula márgenes:
    // autosize ayuda, pero esto lo hace inmediato y suave.
    queueMicrotask(() => this.container.updateContentMargins?.());
  }
}
