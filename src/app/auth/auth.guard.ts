import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
 
export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getCurrentUser();

  if (!user) return router.createUrlTree(['/landing']);

  const expectedRole = route.data['role'];
  return user.role === expectedRole ? true : router.createUrlTree(['/landing']);
};
