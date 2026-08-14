import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiProblem, PartnerUserType } from '../../models/distributor-auth.model';
import { DistributorAuthService } from '../../services/distributor-auth.service';

@Component({
  selector: 'app-distributor-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './distributor-login.component.html',
  styleUrl: './distributor-login.component.scss'
})
export class DistributorLoginComponent implements OnDestroy, OnInit {
  @Input() partnerRole: PartnerUserType = 'AD';
  private readonly formBuilder = inject(FormBuilder);

  readonly credentialsForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]]
  });

  readonly otpForm = this.formBuilder.nonNullable.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  step: 'credentials' | 'otp' = 'credentials';
  loading = false;
  showPassword = false;
  errorMessage = '';
  supportReference = '';
  maskedMobile = '';
  secondsRemaining = 0;

  private challengeId = '';
  private countdown?: ReturnType<typeof setInterval>;

  constructor(
    private readonly distributorAuth: DistributorAuthService,
    private readonly router: Router
  ) {}

  get roleLabel(): string {
    return this.partnerRole === 'MD' ? 'Master Distributor' : 'Distributor';
  }

  get dashboardRoute(): string {
    return this.partnerRole === 'MD'
      ? '/master-distributor/dashboard'
      : '/distributor/dashboard';
  }

  ngOnInit(): void {
    const session = this.distributorAuth.getSession();
    if (session?.userType === this.partnerRole) {
      void this.router.navigate([this.dashboardRoute]);
    }
  }

  submitCredentials(): void {
    this.errorMessage = '';
    this.supportReference = '';
    if (this.credentialsForm.invalid || this.loading) {
      this.credentialsForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.credentialsForm.getRawValue();
    this.loading = true;
    this.distributorAuth
      .login(username, password, this.partnerRole)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: challenge => {
          if (!challenge.otpRequired && challenge.session) {
            void this.router.navigate([this.dashboardRoute]);
            return;
          }
          if (!challenge.challengeId) {
            this.errorMessage = 'The verification session could not be created.';
            return;
          }
          this.challengeId = challenge.challengeId;
          this.maskedMobile = challenge.maskedMobile ?? '';
          this.step = 'otp';
          this.credentialsForm.controls.password.reset();
          this.startCountdown(challenge.expiresInSeconds);
        },
        error: error => this.handleError(error)
      });
  }

  verifyOtp(): void {
    this.errorMessage = '';
    this.supportReference = '';
    if (this.otpForm.invalid || this.loading || !this.challengeId) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.distributorAuth
      .verifyOtp(this.challengeId, this.otpForm.controls.otp.value, this.partnerRole)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.stopCountdown();
          void this.router.navigate([this.dashboardRoute]);
        },
        error: error => {
          this.otpForm.reset();
          this.handleError(error);
        }
      });
  }

  restart(): void {
    this.stopCountdown();
    this.challengeId = '';
    this.maskedMobile = '';
    this.secondsRemaining = 0;
    this.errorMessage = '';
    this.supportReference = '';
    this.otpForm.reset();
    this.step = 'credentials';
  }

  digitsOnly(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 6);
    this.otpForm.controls.otp.setValue(input.value);
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  private startCountdown(seconds: number): void {
    this.stopCountdown();
    this.secondsRemaining = seconds;
    this.countdown = setInterval(() => {
      this.secondsRemaining = Math.max(0, this.secondsRemaining - 1);
      if (this.secondsRemaining === 0) {
        this.stopCountdown();
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdown) {
      clearInterval(this.countdown);
      this.countdown = undefined;
    }
  }

  private handleError(error: HttpErrorResponse): void {
    const problem = (error.error ?? {}) as ApiProblem;
    this.supportReference = problem.traceId ?? '';

    if (error.status === 429) {
      this.errorMessage = 'Too many attempts. Please wait a moment and try again.';
    } else if (error.status === 423) {
      this.errorMessage = 'Sign-in is temporarily locked. Try again later or contact support.';
    } else if (problem.code === 'OTP_EXPIRED') {
      this.errorMessage = 'This verification code has expired. Start sign-in again.';
    } else if (error.status === 0) {
      this.errorMessage = 'Secure sign-in is currently unavailable. Check your connection.';
    } else {
      this.errorMessage = problem.title ?? 'Unable to sign in with the supplied details.';
    }
  }
}
