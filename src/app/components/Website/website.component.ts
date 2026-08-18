import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, Renderer2 } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { WebsiteEnquiryService } from '../../services/website-enquiry.service';

@Component({
  selector: 'app-website',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './website.component.html',
  styleUrls: ['./website.component.scss']
})
export class WebsiteComponent implements AfterViewInit, OnDestroy {
  menuOpen = false;
  activeMega: 'products' | 'partners' | 'company' | 'resources' | 'login' | null = null;
  founderVideoMuted = true;
  headerCompact = false;
  scrollProgress = 0;
  activeFaq = 0;
  activeServiceStory = 0;
  activeDashboard = 0;
  enquirySubmitting = false;
  enquirySuccess = false;
  enquiryFeedback = '';
  currentYear = new Date().getFullYear();
  private revealObserver?: IntersectionObserver;
  private serviceStoryTimer?: ReturnType<typeof setInterval>;
  private dashboardTimer?: ReturnType<typeof setInterval>;

  constructor(
    private host: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private websiteEnquiryService: WebsiteEnquiryService
  ) {}

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

  serviceStories = [
    {
      image: 'assets/images/transformation-service-centre-v1.png',
      alt: 'Customers receiving assistance inside a modern Instant Payment service centre',
      eyebrow: 'Modern service centres',
      lead: 'Transforming everyday access through',
      accent: 'welcoming digital centres.',
      text: 'Purpose-built environments combine friendly guidance, connected services and modern technology to make every customer journey feel simple.',
      tags: ['Assisted access', 'Modern experience'],
      metric: 'Centre ready'
    },
    {
      image: 'assets/images/transformation-customer-assistance-v1.png',
      alt: 'Instant Payment executive assisting an elderly customer with a tablet',
      eyebrow: 'Human-first assistance',
      lead: 'Making digital financial services',
      accent: 'clear, personal and trusted.',
      text: 'Knowledgeable representatives guide customers step by step, combining digital convenience with the confidence of real human support.',
      tags: ['Personal guidance', 'Customer confidence'],
      metric: 'Human first'
    },
    {
      image: 'assets/images/transformation-rural-outreach-v1.png',
      alt: 'Instant Payment field representative guiding a rural family through digital services',
      eyebrow: 'Community outreach',
      lead: 'Bringing useful digital access',
      accent: 'closer to rural communities.',
      text: 'Field-led support and approachable technology help families understand and use essential services without travelling far from home.',
      tags: ['Field assistance', 'Inclusive reach'],
      metric: 'Community led'
    },
    {
      image: 'assets/images/transformation-india-network-v1.png',
      alt: 'Instant Payment tablet connected to a luminous digital network across India',
      eyebrow: 'Connected India',
      lead: 'Powering local service delivery through',
      accent: 'one nationwide network.',
      text: 'Secure digital infrastructure connects partners and communities across India, helping dependable services move further and faster.',
      tags: ['Secure network', 'Nationwide scale'],
      metric: 'India connected'
    }
  ];

  dashboards = [
    { label: 'Retailer', title: 'Retailer Dashboard', image: 'assets/images/dashboard-retailer.png', alt: 'Instant Payment retailer dashboard with wallet, quick services and recent transactions', icon: 'bi-shop-window', note: 'Serve customers and manage daily transactions from one counter.' },
    { label: 'Distributor', title: 'Distributor Dashboard', image: 'assets/images/dashboard-distributor.png', alt: 'Instant Payment distributor dashboard with wallet, network activity and onboarding insights', icon: 'bi-diagram-3', note: 'Track network activity, partner onboarding and territory performance.' },
    { label: 'Master Distributor', title: 'Master Distributor Dashboard', image: 'assets/images/dashboard-master-distributor.png', alt: 'Instant Payment master distributor dashboard with network analytics and recent onboardings', icon: 'bi-buildings', note: 'See the complete distribution network with clear operational intelligence.' },
    { label: 'Sales Team', title: 'Sales Team Dashboard', image: 'assets/images/dashboard-sales-team.png', alt: 'Instant Payment sales team dashboard for partner onboarding management', icon: 'bi-people', note: 'Move every partner application from first draft to successful activation.' }
  ];

  toggleFaq(index: number): void { this.activeFaq = this.activeFaq === index ? -1 : index; }

  toggleFounderVideoMute(video: HTMLVideoElement): void {
    this.founderVideoMuted = !this.founderVideoMuted;
    video.muted = this.founderVideoMuted;
  }

  ngAfterViewInit(): void {
    const root = this.host.nativeElement;
    const revealTargets = root.querySelectorAll<HTMLElement>('main section:not(.hero):not(.credibility-zone), main footer, .impact-intro, .founder-story, .enablement-story--retailer');
    const motionTargets = root.querySelectorAll<HTMLElement>(
      'main section:not(.hero) :is(h2, h3, .eyebrow, p, article, a, button), .impact-intro :is(strong, b), .founder-story :is(.video-kicker, .video-placeholder-copy, .founder-role, h3, blockquote), main footer :is(h2, h3, p, a, button)'
    );
    const actionTargets = root.querySelectorAll<HTMLElement>('main a, main button');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    motionTargets.forEach((target, index) => {
      this.renderer.addClass(target, 'motion-item');
      this.renderer.setStyle(target, '--motion-order', String(index % 5));

    });

    actionTargets.forEach(target => this.renderer.addClass(target, 'motion-action'));

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
    if (!reducedMotion) {
      this.startServiceStoryTimer();
      this.startDashboardTimer();
    }
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
    if (this.serviceStoryTimer) clearInterval(this.serviceStoryTimer);
    if (this.dashboardTimer) clearInterval(this.dashboardTimer);
  }

  selectServiceStory(index: number): void {
    this.activeServiceStory = index;
    this.startServiceStoryTimer();
  }

  nextServiceStory(): void {
    this.activeServiceStory = (this.activeServiceStory + 1) % this.serviceStories.length;
    this.startServiceStoryTimer();
  }

  previousServiceStory(): void {
    this.activeServiceStory = (this.activeServiceStory - 1 + this.serviceStories.length) % this.serviceStories.length;
    this.startServiceStoryTimer();
  }

  private startServiceStoryTimer(): void {
    if (this.serviceStoryTimer) clearInterval(this.serviceStoryTimer);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.serviceStoryTimer = setInterval(() => {
      this.activeServiceStory = (this.activeServiceStory + 1) % this.serviceStories.length;
    }, 6500);
  }

  selectDashboard(index: number): void {
    this.activeDashboard = index;
    this.startDashboardTimer();
  }

  nextDashboard(): void {
    this.activeDashboard = (this.activeDashboard + 1) % this.dashboards.length;
    this.startDashboardTimer();
  }

  previousDashboard(): void {
    this.activeDashboard = (this.activeDashboard - 1 + this.dashboards.length) % this.dashboards.length;
    this.startDashboardTimer();
  }

  private startDashboardTimer(): void {
    if (this.dashboardTimer) clearInterval(this.dashboardTimer);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.dashboardTimer = setInterval(() => {
      this.activeDashboard = (this.activeDashboard + 1) % this.dashboards.length;
    }, 6000);
  }

  submitPartnerEnquiry(event: Event): void {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    if (this.enquirySubmitting || !form.reportValidity()) return;

    const data = new FormData(form);
    this.enquirySubmitting = true;
    this.enquiryFeedback = '';

    this.websiteEnquiryService.submit({
      fullName: String(data.get('name') || '').trim(),
      mobile: String(data.get('mobile') || '').trim(),
      email: String(data.get('email') || '').trim(),
      interest: String(data.get('interest') || '').trim(),
      message: String(data.get('message') || '').trim()
    }).pipe(finalize(() => this.enquirySubmitting = false)).subscribe({
      next: response => {
        this.enquirySuccess = true;
        this.enquiryFeedback = response.message || 'Thank you. Our partner team will contact you shortly.';
        form.reset();
      },
      error: error => {
        this.enquirySuccess = false;
        this.enquiryFeedback = error?.error?.message || 'We could not submit your enquiry right now. Please try again shortly.';
      }
    });
  }
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    if (!this.menuOpen) this.activeMega = null;
  }

  toggleMega(menu: 'products' | 'partners' | 'company' | 'resources' | 'login'): void {
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
