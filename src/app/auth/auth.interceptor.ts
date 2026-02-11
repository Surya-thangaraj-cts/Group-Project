import { HttpInterceptorFn } from '@angular/common/http';

/**
 * HTTP Interceptor to add JWT token to requests
 * Automatically attaches the authentication token to all API requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');
  
  // Clone the request and add authorization header if token exists
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req);
};
