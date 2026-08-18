import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { unlockComponent } from './components/Lock-Screen/unlock.component';
import { IdleService } from './services/idle.service';
import { filter } from 'rxjs/operators';
import { LoaderComponent } from './components/app-loader/loader.component';
import { GlobalLoaderService } from './services/global-loader.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, unlockComponent, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  showUnlock = false;
  warningSeconds?: number;

  constructor(private idleService: IdleService, private router: Router, public globalLoader: GlobalLoaderService) { }

  ngOnInit() {
    // Route change watcher
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (this.isPublicAuthRoute(event.urlAfterRedirects)) {
          
          this.idleService.stop();
          this.showUnlock = false;
          this.warningSeconds = undefined;
        } else {
          
          this.idleService.start();
        }
      });

    this.idleService.locked$.subscribe(() => {
      if (this.isPublicAuthRoute(this.router.url)) {
        return;
      }
      if (sessionStorage.getItem('instantpay.distributor.session')) {
        const sessionValue = sessionStorage.getItem('instantpay.distributor.session');
        let userType = 'AD';
        try {
          userType = JSON.parse(sessionValue ?? '{}').userType ?? 'AD';
        } catch {}
        sessionStorage.removeItem('instantpay.distributor.session');
        this.idleService.stop();
        // Reset the sticky idle-lock flag so it doesn't keep re-triggering (and wiping
        // the next login's session) on every future reload before the user logs back in.
        this.idleService.unlockDone();
        void this.router.navigate([
          userType === 'MD' ? '/master-distributor-login' : '/distributor-login'
        ]);
        return;
      }
      this.showUnlock = true;
      this.warningSeconds = undefined;
    });

    this.idleService.warning$.subscribe((sec) => {
      if (!this.showUnlock && !this.isPublicAuthRoute(this.router.url)) {
        this.warningSeconds = sec;
      }
    });
  }

  onUnlocked() {
    this.showUnlock = false;
    this.warningSeconds = undefined;
    this.idleService.unlockDone();
  }

  private isPublicAuthRoute(url: string): boolean {
    return url === '/'
      || url.includes('/login')
      || url.includes('/distributor-login')
      || url.includes('/master-distributor-login')
      || url.includes('/reset-password');
  }

}
