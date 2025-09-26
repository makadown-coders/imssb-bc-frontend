import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initThemeFromStorage } from './app/shared/theme.utils';

// Aplica el tema guardado ANTES del bootstrap para evitar FOUC
initThemeFromStorage();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
