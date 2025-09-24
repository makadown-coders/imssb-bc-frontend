import { Component } from '@angular/core';
import { LoginFormComponent } from '@imssb-bc/auth-ui';

@Component({
  standalone: true,
  imports: [LoginFormComponent],
  template: `<imssb-login-form [nombreApp]="'SSO Sandbox'" />`,
})
export class LoginPage {}