import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, Renderer2 } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-website',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './website.component.html',
  styleUrls: ['./website.component.scss']
})
export class WebsiteComponent implements AfterViewInit, OnDestroy {
  menuOpen = false;
  activeMega: 'products' | 'partners' | 'company' | 'resources' | null = null;
  headerCompact = false;
  scrollProgress = 0;
  activeFaq = 0;
  currentYear = new Date().getFullYear();
  private revealObserver?: IntersectionObserver;

  constructor(private host: ElementRef<HTMLElement>, private renderer: Renderer2) {}

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

  ngAfterViewInit(): void {
    const root = this.host.nativeElement;
    const revealTargets = root.querySelectorAll<HTMLElement>('main section:not(.hero), main footer, .enablement-story--retailer');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    revealTargets.forEach((target, index) => {
      this.renderer.addClass(target, 'reveal-item');
      this.renderer.setStyle(target, '--reveal-order', String(index % 3));
      if (reducedMotion) this.renderer.addClass(target, 'is-visible');
    });

    if (!reducedMotion && 'IntersectionObserver' in window) {
      this.revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          this.renderer.addClass(entry.target, 'is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
      revealTargets.forEach(target => this.revealObserver?.observe(target));
    } else {
      revealTargets.forEach(target => this.renderer.addClass(target, 'is-visible'));
    }

    this.updateScrollState();
  }

  ngOnDestroy(): void { this.revealObserver?.disconnect(); }
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    if (!this.menuOpen) this.activeMega = null;
  }

  toggleMega(menu: 'products' | 'partners' | 'company' | 'resources'): void {
    this.activeMega = this.activeMega === menu ? null : menu;
  }

  closeMenu(): void {
    this.menuOpen = false;
    this.activeMega = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeMenu(); }

  @HostListener('window:scroll')
  updateScrollState(): void {
    const top = window.scrollY || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    this.headerCompact = top > 36;
    this.scrollProgress = height > 0 ? Math.min(100, Math.max(0, (top / height) * 100)) : 0;
  }
}
