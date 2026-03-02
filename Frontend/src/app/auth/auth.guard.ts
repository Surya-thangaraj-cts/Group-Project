import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { AuthService } from './auth.service';

type CanonicalRole = 'admin' | 'bankManager' | 'bankOfficer';

function normalizeRole(role: any): CanonicalRole | null {
  const r = (role ?? '').toString().trim().toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'manager' || r === 'bankmanager') return 'bankManager';
  if (r === 'officer' || r === 'bankofficer') return 'bankOfficer';
  return null;
}

function expectedRolesFromData(data: any): CanonicalRole[] {
  const dataRole = data?.['role'];
  const roles: string[] = Array.isArray(dataRole) ? dataRole : (dataRole ? [dataRole] : []);
  return roles
    .map(normalizeRole)
    .filter((r): r is CanonicalRole => !!r);
}

function checkAccess(
  expected: CanonicalRole[] | undefined,
  stateUrl?: string
): boolean | UrlTree {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.getCurrentUser();
  if (!user) {
    return router.createUrlTree(['/signin'], {
      queryParams: { returnUrl: stateUrl ?? '/' }
    });
  }

  const status = (user.status ?? 'inactive').toString().toLowerCase();
  if (status !== 'active') {
    return router.createUrlTree(['/signin'], {
      queryParams: { reason: 'inactive', returnUrl: stateUrl ?? '/' }
    });
  }

  const userRole = normalizeRole(user.role);
  const allowed = expected ?? [];
  if (!allowed.length) return true;

  if (userRole && allowed.includes(userRole)) return true;

  return router.createUrlTree(['/signin'], {
    queryParams: { reason: 'forbidden', returnUrl: stateUrl ?? '/' }
  });
}

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const expected = expectedRolesFromData(route.data);
  return checkAccess(expected, state.url);
};
