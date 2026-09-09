import { Routes } from '@angular/router';

import { authGuard, rootRedirectGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [rootRedirectGuard],
    children: []
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard')
        .then(m => m.DashboardComponent)
  },
  {
    path: 'request/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/request/request-form/request-form')
        .then(m => m.RequestFormComponent)
  },
  {
    path: 'request/edit/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/request/request-form/request-form')
        .then(m => m.RequestFormComponent)
  },
  {
    path: 'request-management',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/request/request-management/request-management')
        .then(m => m.RequestManagementComponent)
  },
  {
    path: 'request-management/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/request/request-management/request-management')
        .then(m => m.RequestManagementComponent)
  },
  {
    path: '**',
    canActivate: [rootRedirectGuard],
    children: []
  }
];