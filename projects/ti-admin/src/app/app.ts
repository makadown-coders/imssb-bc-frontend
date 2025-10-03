import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingOverlayComponent, LoadingService } from '@imssb-bc/auth-ui';

@Component({
  selector: 'ti-root',
  imports: [CommonModule, RouterOutlet, LoadingOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ti-admin');
  public loader = inject(LoadingService);
}
