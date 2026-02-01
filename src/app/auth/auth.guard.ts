import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanMatchFn,
  Route,
  UrlSegment
} from '@angular/router';
import { AuthService } from './auth.service';

type CanonicalRole = 'admin' | 'bankManager' | 'bankOfficer';

/** Normalize any UI/service label into canonical role keys used in storage */
function normalizeRole(role: any): CanonicalRole | null {
  const r = (role ?? '').toString().trim().toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'manager' || r === 'bankmanager') return 'bankManager';
  if (r === 'officer' || r === 'bankofficer') return 'bankOfficer';
  return null;
}

/** Read expected roles from route data; accepts string or string[] */
function expectedRolesFromData(data: any): CanonicalRole[] {
  const dataRole = data?.['role'];
  const roles: string[] = Array.isArray(dataRole) ? dataRole : (dataRole ? [dataRole] : []);
  return roles
    .map(normalizeRole)
    .filter((r): r is CanonicalRole => !!r);
}

/** Shared check for both canActivate and canMatch */
function checkAccess(
  expected: CanonicalRole[] | undefined,
  stateUrlWhenKnown?: string
): boolean | UrlTree {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.getCurrentUser();
  if (!user) {
    return router.createUrlTree(['/unauthorized']);
  }

  const status = (user.status ?? 'inactive').toString().toLowerCase();
  if (status !== 'active') {
    return router.createUrlTree(['/unauthorized']);
  }

  const userRole = normalizeRole(user.role);
  const allowed = expected ?? [];
  if (!allowed.length) return true; // no role restriction → just needs to be authenticated & active

  if (userRole && allowed.includes(userRole)) return true;

  return router.createUrlTree(['/unauthorized']);
}

/** Use on eager routes (your /admin, /manager) */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const expected = expectedRolesFromData(route.data);
  return checkAccess(expected, state.url);
};

/** Use on lazy feature route definitions (e.g., officer loadChildren) */
export const roleMatchGuard: CanMatchFn = (
  route: Route,
  segments: UrlSegment[]
): boolean | UrlTree => {
  const expected = expectedRolesFromData(route.data);
  const url = '/' + segments.map(s => s.path).join('/');
  return checkAccess(expected, url);
};
