import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  isOpen = signal(false);
  message = signal('Cargando…');

  show(msg?: string) {
    if (msg) this.message.set(msg);
    this.isOpen.set(true);
  }

  hide() { this.isOpen.set(false); }

  async wrap<T>(promise: Promise<T>, msg = 'Cargando…'): Promise<T> {
    this.show(msg);
    try { return await promise; }
    finally { this.hide(); }
  }
}
