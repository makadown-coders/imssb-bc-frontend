import { ChangeDetectionStrategy, Component, effect, Input, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="loading-overlay" *ngIf="visible()" role="status" aria-live="polite">
      <div class="panel surface-card">
       <mat-spinner diameter="32"></mat-spinner>
        <div class="txt">{{ text() || 'Cargando…' }}</div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }    
  `]
})
export class LoadingOverlayComponent {
  /** Control externo (signal/boolean) */
  public visible = input<boolean>(false);
  /** Texto opcional */
  public text = input<string>('Test…');

  // Bloquea el scroll de la página mientras está visible
  private _lock = effect(() => {
    if (this.visible()) document.body.classList.add('loading-open');
    else document.body.classList.remove('loading-open');
  });
}
