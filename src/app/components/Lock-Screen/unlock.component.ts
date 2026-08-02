import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { EncryptionService } from '../../encryption/encryption.service';
import { NgbModal, NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-unlock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unlock.component.html',
  styleUrls: ['./unlock.component.scss']
})
export class unlockComponent {
  @Output() unlocked = new EventEmitter<void>();

  mode: 'mpin' | 'password' = 'mpin';
  value = '';
  isLoading = false;
  error: string | null = null;
  userId = '';
  username = '';
  digits: string[] = ['', '', '', ''];
  showConfirmation = false;

  constructor(public auth: AuthService, private _encrypt: EncryptionService, private toastr: ToastrService) { }

  ngOnInit() {
    this.username = this.auth.getUsername();
  }

  switchMode() {
    this.mode = this.mode === 'mpin' ? 'password' : 'mpin';
    this.value = '';
    this.error = null;
    this.digits = ['', '', ''];
  }

  onDigitInput(event: any, index: number) {
    const input = event.target;
    const value = input.value;

    // Allow only digits
    if (!/^\d$/.test(value)) {
      this.digits[index] = '';
      input.value = '';
      return;
    }

    // Move focus to next input automatically
    const nextInput = document.querySelectorAll('.mpin-input-container input')[index + 1] as HTMLElement;
    if (nextInput) {
      nextInput.focus();
    }

    // Update the combined value
    this.value = this.digits.join('');
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        // Clear previous box and move focus
        this.digits[index - 1] = '';
        const prevInput = document.querySelectorAll('.mpin-input-container input')[index - 1] as HTMLElement;
        if (prevInput) {
          event.preventDefault(); // prevent default backspace behavior
          prevInput.focus();
        }
      }
    }
  }

  onConfirm() {
    this.unlocked.emit();
    window.location.reload(); // Reload page on OK click
  }

  unlock() {
    this.userId = this.auth.getUserId();
    if (!this.userId) {
      this.error = 'User not found';
      return;
    }

    if (this.mode === 'mpin') {

      if (this.digits.some(d => d === '' || !/^\d$/.test(d))) {
        this.error = 'Please enter a valid 4-digit MPIN';
        return;
      }

      this.value = this.digits.join('');
    }

    if (!this.value) {
      this.error = 'Please enter your credentials';
      return;
    }

    this.isLoading = true;
    this.auth.unlock({ userId: String(this.userId), method: this.mode, value: this._encrypt.encrypt(this.value), userType:this.auth.getUsertype() }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res?.token || res?.Token) {
          const token = res.token ?? res.Token;
          //this.auth.saveToken(res);
          this.showConfirmation = true;
        } else {
          this.error = 'Unexpected server response';
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err?.status === 423) {
          this.toastr.error('Account is locked. Please contact support.');
        } else if (err?.status === 429) {
          this.toastr.error('Too many attempts. Please try again later.');
        } else if (err?.status === 222) {
          this.toastr.error('Invalid credentials');
        } else {
          this.toastr.error('Invalid credentials');
        }
      }
    });
  }
}


