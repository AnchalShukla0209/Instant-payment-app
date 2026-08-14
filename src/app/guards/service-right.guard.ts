import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const serviceRightGuard: CanActivateFn = route => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const right = route.data?.['serviceRight'] as 'razorpaypayment' | 'settlement' | undefined;

  if (!right || authService.getUsertype() !== 'Retailer') return true;

  const userId = Number(authService.getUserId());
  if (!userId) return router.createUrlTree(['/login']);

  return authService.getUserRightsInfo(userId).pipe(
    map(rights =>
      rights?.[right]?.toLowerCase() === 'active'
        ? true
        : router.createUrlTree(['/dashboard'])
    ),
    catchError(() => of(router.createUrlTree(['/dashboard'])))
  );
};
