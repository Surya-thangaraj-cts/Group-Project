import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
 
export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getCurrentUser();
 
  // 🔒 If no user is logged in, always redirect to landing
  if (!user) {
    console.log('Guard blocked: no user logged in');
    return router.createUrlTree(['/landing']);
  }
 
  // 🔒 If user exists but role doesn't match, redirect to landing
  const expectedRole = route.data['role'];
  if (user.role !== expectedRole) {
    console.log(`Guard blocked: role mismatch. Expected ${expectedRole}, got ${user.role}`);
    return router.createUrlTree(['/landing']);
  }
 
  // ✅ Allow navigation
  return true;
};