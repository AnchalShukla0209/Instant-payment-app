import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-website',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './website.component.html',
  styleUrls: ['./website.component.scss']
})
export class WebsiteComponent {
  menuOpen = false;
  activeFaq = 0;
  currentYear = new Date().getFullYear();

  services = [
    { icon: 'bi-fingerprint', title: 'AEPS', text: 'Cash withdrawal, balance enquiry and mini statements through Aadhaar.' },
    { icon: 'bi-arrow-left-right', title: 'Money Transfer', text: 'Fast, secure domestic money transfers available across India.' },
    { icon: 'bi-receipt-cutoff', title: 'Bill Payments', text: 'Electricity, water, gas, broadband and FASTag bills from one place.' },
    { icon: 'bi-phone', title: 'Recharge', text: 'Instant mobile and DTH recharges with reliable operator connectivity.' },
    { icon: 'bi-bank', title: 'Micro ATM', text: 'Turn your retail outlet into an assisted digital banking point.' },
    { icon: 'bi-shield-check', title: 'Insurance', text: 'Offer accessible protection products backed by trusted partners.' }
  ];

  faqs = [
    { q: 'What is Instant Payment?', a: 'Instant Payment is a technology-led financial services platform that enables retailers and partners to offer assisted banking, payments and digital services.' },
    { q: 'Who can become a retail partner?', a: 'Any eligible Indian retailer or entrepreneur with a physical outlet and the required KYC documents can apply to join our partner network.' },
    { q: 'Are transactions secure?', a: 'Yes. Our platform uses encrypted communication, monitored transactions and role-based controls to protect partner and customer activity.' },
    { q: 'How do I get started?', a: 'Choose “Become a Partner”, submit your details, and our onboarding team will contact you for verification and activation.' }
  ];

  toggleFaq(index: number): void { this.activeFaq = this.activeFaq === index ? -1 : index; }
  closeMenu(): void { this.menuOpen = false; }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.menuOpen = false; }
}
