import { APP_INITIALIZER, ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AUTH_CONFIG, AuthInterceptor } from '@imssb-bc/auth-core'; // usa tu alias de paths
import { routes } from './app.routes';
import { RuntimeConfigService } from './services/runtime-config.service';
import { LoaderInterceptor } from '@imssb-bc/auth-ui';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor, LoaderInterceptor])),
    // 1) Cargar /env.json antes de arrancar
    provideAppInitializer( () => {
      const rc = inject(RuntimeConfigService);
      return rc.load();
    }),
    // 2) Construir AUTH_CONFIG con el valor cargado (fallback local)
    {
      provide: AUTH_CONFIG,
      deps: [RuntimeConfigService],
      useFactory: (rc: RuntimeConfigService) => ({
        baseUrl: rc.apiUrl || 'http://localhost:3000',
        // opcionalmente: loginPath, refreshPath, mePath, logoutPath...
      }),
    },
    {provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 2500}}
  ],
};