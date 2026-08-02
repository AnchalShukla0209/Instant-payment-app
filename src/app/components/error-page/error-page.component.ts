import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface ErrorPageConfig {
  code: string;
  title: string;
  description: string;
  icon: string;
  colorClass: 'purple' | 'amber' | 'red' | 'blue';
  primaryAction: { label: string; action: 'home' | 'retry' | 'login' };
  showBack: boolean;
}

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.scss']
})
export class ErrorPageComponent implements OnInit {
  config!: ErrorPageConfig;
  showPulseDots = false;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.config = this.route.snapshot.data['errorConfig'];
    this.showPulseDots = this.config?.code === '503';
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    window.history.back();
  }

  retry(): void {
    window.location.reload();
  }

  goLogin(): void {
    this.router.navigate(['/login']);
  }

  handlePrimary(): void {
    if (this.config.primaryAction.action === 'retry') this.retry();
    else if (this.config.primaryAction.action === 'login') this.goLogin();
    else this.goHome();
  }
}
