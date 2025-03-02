import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs';

/**
 * A route guard that restricts access to authenticated users only.
 * - If a user is authenticated, the guard allows access to the route.
 * - If no user is authenticated, the guard redirects to the homepage (``).
 * @returns {Observable<boolean>} - An observable that resolves to `true` (access granted) or `false` (access denied).
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    map((user) => {
      if (user) {
        return true;
      } else {
        router.navigate(['']);
        return false;
      }
    })
  );
};
