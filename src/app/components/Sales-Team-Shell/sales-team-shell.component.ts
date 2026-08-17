import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DistributorAuthService } from '../../services/distributor-auth.service';
import { SalesTeamOnboardingService } from '../../services/sales-team-onboarding.service';

@Component({
  selector: 'app-sales-team-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './sales-team-shell.component.html',
  styleUrl: './sales-team-shell.component.scss'
})
export class SalesTeamShellComponent implements OnInit, OnDestroy {
  private readonly auth = inject(DistributorAuthService);
  private readonly api = inject(SalesTeamOnboardingService);
  private readonly router = inject(Router);
  readonly session = this.auth.getSession();
  menuOpen = false;
  now = new Date();
  counts = { draft: 0, review: 0, rejected: 0, approved: 0 };
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.timer = setInterval(() => this.now = new Date(), 60000);
    forkJoin({
      draft: this.api.list({ pageIndex: 1, pageSize: 1, status: 'Draft' }),
      review: this.api.list({ pageIndex: 1, pageSize: 1, status: 'Review' }),
      rejected: this.api.list({ pageIndex: 1, pageSize: 1, status: 'Rejected' }),
      approved: this.api.list({ pageIndex: 1, pageSize: 1, status: 'Approved' })
    }).subscribe({
      next: result => this.counts = {
        draft: result.draft.data.totalCount,
        review: result.review.data.totalCount,
        rejected: result.rejected.data.totalCount,
        approved: result.approved.data.totalCount
      }
    });
  }

  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }
  closeMenu(): void { this.menuOpen = false; }
  logout(): void { this.auth.clearSession(); void this.router.navigate(['/salesteam-login']); }

  get greeting(): string {
    const hour = this.now.getHours();
    if (hour < 5) return 'Good Night';
    if (hour < 12) return 'Good Morning';
    if (hour < 14) return 'Good Noon';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  }

  get loginIp(): string {
    const ip = this.session?.ipAddress;
    return ip === '::1' || ip === '127.0.0.1' ? 'Local computer' : (ip || 'Not available');
  }
}
