import { Component, inject, Input, signal } from '@angular/core';
import { AuthClient } from '@imssb-bc/auth-core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'imssb-login-form',
    standalone: true,
    imports: [
      CommonModule,
      ReactiveFormsModule,
      MatCardModule,
      MatFormFieldModule,
      MatInputModule,
      MatButtonModule,
      MatIconModule
    ],
    templateUrl: './login-form.component.html',
    styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent {
  @Input() logoSrc = 'imssb-logo.svg';
  @Input() nombreApp = 'IMSS Bienestar Baja California';
  private fb = inject(FormBuilder);
  private auth = inject(AuthClient);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  show = signal(false);
  toggle = () => this.show.set(!this.show());

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async onSubmit() {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true); this.error.set(null);
    try {
      const { email, password } = this.form.value as any;
      await this.auth.login(email, password);
      this.router.navigateByUrl('/'); // redirige al home protegido
    } catch (e: any) {
      const msg = e?.error?.error || e?.message || 'Error de autenticación';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}
