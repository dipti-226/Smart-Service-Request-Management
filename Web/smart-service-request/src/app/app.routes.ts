import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard')
        .then(m => m.DashboardComponent)
  },
  {
    path: 'request/new',
    loadComponent: () =>
      import('./features/request/request-form/request-form')
        .then(m => m.RequestFormComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];