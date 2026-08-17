import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DistributorAuthService } from '../services/distributor-auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const distributorAuth = inject(DistributorAuthService);
  const distributorSession = distributorAuth.getSession();
  const requiredPartnerRole = route.data?.['partnerRole'] as 'AD' | 'MD' | 'ST' | undefined;
  const sessionKey = localStorage.getItem('sessionKey');

  if (requiredPartnerRole) {
    if (!distributorSession || distributorSession.userType !== requiredPartnerRole) {
      router.navigate([
        requiredPartnerRole === 'MD' ? '/master-distributor-login'
          : requiredPartnerRole === 'ST' ? '/salesteam-login' : '/distributor-login'
      ]);
      return false;
    }
    return true;
  }

  if (!sessionKey && !distributorSession) {
    router.navigate(['/login']);
    return false;
  }

  if (distributorSession) {
    router.navigate([
      distributorSession.userType === 'MD' ? '/master-distributor/dashboard'
        : distributorSession.userType === 'ST' ? '/sales-team/dashboard' : '/distributor/dashboard'
    ]);
    return false;
  }

  // Check if OTP verification is required and completed
  if (!authService.isOtpVerified()) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
