import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AuthClient, TokenStore } from '@imssb-bc/auth-core';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule],
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage {
  private client = inject(AuthClient);
  private store = inject(TokenStore);

  theme = signal<'claro' | 'oscuro'>(document.body.classList.contains('dark-theme') ? 'oscuro' : 'claro');

  async logout() {
    this.client.logoutLocal();
    location.href = '/login';
  }
  toggleTheme() {
    document.body.classList.toggle('dark-theme');
    this.theme.set(document.body.classList.contains('dark-theme') ? 'oscuro' : 'claro');
  }
}
