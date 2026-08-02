import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  const sessionKey = localStorage.getItem('sessionKey');
  
  if (!sessionKey) {
    router.navigate(['/login']);
    return false;
  }

  // Check if OTP verification is required and completed
  if (!authService.isOtpVerified()) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
