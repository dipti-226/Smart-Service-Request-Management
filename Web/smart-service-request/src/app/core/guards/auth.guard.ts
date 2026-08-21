import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Protects application routes (dashboard, request pages) from being
 * accessed unless the admin has logged in successfully. Redirects to
 * the login page otherwise.
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
 * Used on the root ('') and wildcard ('**') paths so the app always
 * opens on the login page for a logged-out admin, and only sends an
 * already logged-in admin straight to the dashboard.
 */
export const rootRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return router.createUrlTree(
    [authService.isLoggedIn() ? '/dashboard' : '/login']
  );
};
