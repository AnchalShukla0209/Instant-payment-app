// auth-role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // Check role
    if (role === 'SuperAdmin' || role === 'Retailer') {
      return true;
    }

    this.router.navigate(['/unauthorized']);
    return false;
  }
}
