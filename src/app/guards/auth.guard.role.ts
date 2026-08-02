// auth-role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Check if OTP verification is required and completed
    if (!this.authService.isOtpVerified()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Check role
    if (role === 'SuperAdmin' || role === 'Retailer' || role==='RT') {
      return true;
    }

    this.router.navigate(['/unauthorized']);
    return false;
  }
}
