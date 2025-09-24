import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoginFormComponent } from '@imssb-bc/auth-ui';

@Component({
  standalone: true,
  imports: [LoginFormComponent],
  template: `<imssb-login-form [nombreApp]="'SSO Sandbox'" redirectTo="/dash" />`,
})
export class LoginPage {
  private route = inject(ActivatedRoute);
  destino = computed(() => this.route.snapshot.queryParamMap.get('returnUrl') || '/dash');
}