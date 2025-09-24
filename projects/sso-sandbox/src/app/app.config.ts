// projects/sso-sandbox/src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';


import { AUTH_CONFIG, authInterceptor } from '@imssb-bc/auth-core'; // usa tu alias de paths
import { routes } from './app.routes';


export const appConfig: ApplicationConfig = {
  providers: [
    // provideAnimations(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: AUTH_CONFIG, 
      useValue: { 
        baseUrl: 'http://localhost:3000'
      }
    }, // ⚠️ apunta a tu backend
  ],
};
