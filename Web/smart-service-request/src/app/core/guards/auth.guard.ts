import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Protects application routes from being accessed unless the user
 * has logged in successfully. Redirects to the login page otherwise.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

/**
 * Role based route protection. The allowed roles are given in the
 * route as: data: { roles: ['Admin'] }
 * Not logged in -> login page.
 * Logged in but role not allowed -> that user's own home page.
 * (This only controls what the user sees. The API enforces the real security.)
 */
export const roleGuard: CanActivateFn = route => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = (route.data?.['roles'] as string[] | undefined) ?? [];

  if (allowedRoles.length === 0 || authService.hasRole(allowedRoles)) {
    return true;
  }

  return router.createUrlTree([authService.getHomeRoute()]);
};

/**
 * Used on the root ('') and wildcard ('**') paths so the app always
 * opens on the login page for a logged-out user, and sends an
 * already logged-in user to the home page of their role.
 */
export const rootRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return router.createUrlTree(
    [authService.isLoggedIn() ? authService.getHomeRoute() : '/login']
  );
};