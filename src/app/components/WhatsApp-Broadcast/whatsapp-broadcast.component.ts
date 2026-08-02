import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AdminConfigService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../app-loader/loader.component';

export interface BroadcastResult {
    totalUsers: number;
    successfulSends: number;
    failedSends: number;
    failedPhoneNumbers?: string[];
    sentAt?: string;
}

@Component({
    selector: 'app-whatsapp-broadcast',
    standalone: true,
    imports: [CommonModule, FormsModule, LoaderComponent],
    templateUrl: './whatsapp-broadcast.component.html',
    styleUrls: ['./whatsapp-broadcast.component.scss']
})
export class WhatsAppBroadcastComponent implements OnInit {

    isLoading = false;
    isAdmin = false;

    appLink = '';
    sendToActiveUsersOnly = true;

    broadcastResult: BroadcastResult | null = null;
    broadcastMessage = '';
    broadcastSuccess = false;

    showFailedNumbers = false;

    selectedTemplate: 'app_update' | 'settlement' = 'app_update';

    settlementMessage = '';
    showEmojiPicker = false;
    activeEmojiGroup = 0;

    @ViewChild('settlementTextarea') settlementTextareaRef!: ElementRef<HTMLTextAreaElement>;

    readonly emojiGroups = [
        { label: 'Smileys', icon: '😀', emojis: ['😀','😊','😂','🤣','😍','🥰','😎','🤩','😉','😋','😇','🤗','🤔','😐','🙄','😏','😒','😞','😟','🙁','😢','😭','😤','😠','😡','😱','😳','🥺','😴','😷','🤒','🤕'] },
        { label: 'Gestures', icon: '👍', emojis: ['👍','👎','👌','✌️','🤞','👋','✋','🤝','👏','🙌','🙏','💪','☝️','👆','👇','👈','👉','🤙','🖐️','🫶','🫂','💅','🤳'] },
        { label: 'Money', icon: '💰', emojis: ['💰','💵','💴','💶','💷','💳','🏦','💸','💹','📈','📉','🤑','💎','🏆','🥇','🎁','🎉','🎊','✅','❌','⚠️','🔔','📢','📣','🚨','🔥','⭐','🌟','✨','💫','🆕','📱'] },
        { label: 'Symbols', icon: '✅', emojis: ['✅','❌','⭕','❓','❗','⚠️','🔴','🟢','🔵','🟡','⚫','⚪','🔷','🔸','🔹','▶️','⏩','🔄','♻️','✔️','➕','➖','💯','🔑','🔒','🔓','📌','📍','🏷️','🔗','📋','📝'] }
    ];

    constructor(
        private adminApi: AdminConfigService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        const usertype = this.authService.getUsertype();
        if (usertype !== 'SuperAdmin') {
            this.router.navigate(['/forbidden']);
            return;
        }
        this.isAdmin = true;
    }

    get successRate(): number {
        if (!this.broadcastResult || this.broadcastResult.totalUsers === 0) return 0;
        return Math.round((this.broadcastResult.successfulSends / this.broadcastResult.totalUsers) * 100);
    }

    get failRate(): number {
        if (!this.broadcastResult || this.broadcastResult.totalUsers === 0) return 0;
        return Math.round((this.broadcastResult.failedSends / this.broadcastResult.totalUsers) * 100);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!(event.target as HTMLElement).closest('.emoji-picker-wrap')) {
            this.showEmojiPicker = false;
        }
    }

    selectTemplate(tpl: 'app_update' | 'settlement'): void {
        this.selectedTemplate = tpl;
        this.broadcastResult = null;
        this.broadcastMessage = '';
        this.showFailedNumbers = false;
        this.showEmojiPicker = false;
    }

    toggleEmojiPicker(): void {
        this.showEmojiPicker = !this.showEmojiPicker;
    }

    insertEmoji(emoji: string): void {
        const textarea = this.settlementTextareaRef?.nativeElement;
        if (!textarea) {
            this.settlementMessage += emoji;
            return;
        }
        const start = textarea.selectionStart ?? this.settlementMessage.length;
        const end   = textarea.selectionEnd   ?? this.settlementMessage.length;
        this.settlementMessage = this.settlementMessage.slice(0, start) + emoji + this.settlementMessage.slice(end);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        }, 0);
    }

    sendBroadcast(): void {
        if (this.selectedTemplate === 'app_update' && !this.appLink.trim()) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'App link cannot be empty.' });
            return;
        }
        if (this.selectedTemplate === 'settlement' && !this.settlementMessage.trim()) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'Message cannot be empty.' });
            return;
        }

        const audienceLabel = this.selectedTemplate === 'settlement'
            ? 'active users'
            : (this.sendToActiveUsersOnly ? 'active' : 'all') + ' users';

        Swal.fire({
            title: 'Confirm Broadcast',
            html: `You are about to send a WhatsApp message to <strong>${audienceLabel}</strong>.<br><br>This action cannot be undone. Proceed?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#25D366',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Send Broadcast',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.executeBroadcast();
            }
        });
    }

    private executeBroadcast(): void {
        this.isLoading = true;
        this.broadcastResult = null;
        this.broadcastMessage = '';
        this.showFailedNumbers = false;

        const payload = this.selectedTemplate === 'settlement'
            ? { link: this.settlementMessage.trim(), sendToActiveUsersOnly: true }
            : { templateName: 'app_service_update', languageCode: 'hi', link: this.appLink.trim(), sendToActiveUsersOnly: this.sendToActiveUsersOnly };

        this.adminApi.broadcastWhatsApp(payload).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res?.success) {
                    this.broadcastSuccess = true;
                    this.broadcastMessage = res.message || 'Broadcast completed successfully.';
                    this.broadcastResult = res.data || null;
                } else {
                    this.broadcastSuccess = false;
                    this.broadcastMessage = res?.message || 'Broadcast failed.';
                    this.broadcastResult = res?.data || null;
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.broadcastSuccess = false;
                this.broadcastMessage = err?.error?.message || 'An error occurred while sending the broadcast.';
                this.broadcastResult = null;
            }
        });
    }

    resetForm(): void {
        this.appLink = '';
        this.sendToActiveUsersOnly = true;
        this.selectedTemplate = 'app_update';
        this.settlementMessage = '';
        this.showEmojiPicker = false;
        this.broadcastResult = null;
        this.broadcastMessage = '';
        this.broadcastSuccess = false;
        this.showFailedNumbers = false;
    }

    toggleFailedNumbers(): void {
        this.showFailedNumbers = !this.showFailedNumbers;
    }

    formatPhoneDisplay(phone: string): string {
        if (phone.startsWith('91') && phone.length === 12) {
            return '+91 ' + phone.slice(2, 7) + ' ' + phone.slice(7);
        }
        return phone;
    }
}
