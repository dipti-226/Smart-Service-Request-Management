import {ApplicationConfig,provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideHttpClient,withInterceptors} from '@angular/common/http';
import {TitleStrategy,provideRouter,withRouterConfig} from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AppTitleStrategy } from './core/services/app-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideHttpClient(
      withInterceptors([authInterceptor])
    ),

    provideRouter(
      routes,
      withRouterConfig({
        onSameUrlNavigation: 'reload'
      })
    ),

    { provide: TitleStrategy, useClass: AppTitleStrategy }
  ]
};