import { Routes } from '@angular/router';

import {
  authGuard,
  roleGuard,
  rootRedirectGuard
} from './core/guards/auth.guard';

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
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register')
        .then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () =>
      import('./features/dashboard/dashboard')
        .then(m => m.DashboardComponent)
  },
  {
    path: 'my-requests',
    canActivate: [roleGuard],
    data: { roles: ['Employee'] },
    loadComponent: () =>
      import('./features/request/my-requests/my-requests')
        .then(m => m.MyRequestsComponent)
  },
  {
    path: 'request/new',
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Employee'] },
    loadComponent: () =>
      import('./features/request/request-form/request-form')
        .then(m => m.RequestFormComponent)
  },
  {
    path: 'request/edit/:id',
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () =>
      import('./features/request/request-form/request-form')
        .then(m => m.RequestFormComponent)
  },
  {
    path: 'request-management',
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () =>
      import('./features/request/request-management/request-management')
        .then(m => m.RequestManagementComponent)
  },
  {
    path: 'request-management/:id',
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () =>
      import('./features/request/request-management/request-management')
        .then(m => m.RequestManagementComponent)
  },

  {
    path: 'users',
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () =>
      import('./features/user/user-list/user-list')
        .then(m => m.UserListComponent)
  },
  {
    path: 'users/technician/new',
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () =>
      import('./features/user/technician-form/technician-form')
        .then(m => m.TechnicianFormComponent)
  },

    {
    path: 'assigned-requests',
    canActivate: [roleGuard],
    data: { roles: ['Technician'] },
    loadComponent: () =>
      import('./features/technician/assigned-requests/assigned-requests')
        .then(m => m.AssignedRequestsComponent)
  },
  {
    path: 'assigned-requests/:id',
    canActivate: [roleGuard],
    data: { roles: ['Technician'] },
    loadComponent: () =>
      import('./features/technician/assigned-request-details/assigned-request-details')
        .then(m => m.AssignedRequestDetailsComponent)
  },
  
    {
    path: 'my-requests/:id',
    canActivate: [roleGuard],
    data: { roles: ['Employee'] },
    loadComponent: () =>
      import('./features/employee/my-request-details/my-request-details')
        .then(m => m.MyRequestDetailsComponent)
  },
  {
    path: 'my-requests/:id/edit',
    canActivate: [roleGuard],
    data: { roles: ['Employee'] },
    loadComponent: () =>
      import('./features/employee/my-request-edit/my-request-edit')
        .then(m => m.MyRequestEditComponent)
  },
  
  {
    path: 'no-access',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/no-access/no-access')
        .then(m => m.NoAccessComponent)
  },
  {
    path: '**',
    canActivate: [rootRedirectGuard],
    children: []
  }
];