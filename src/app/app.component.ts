import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { unlockComponent } from './components/Lock-Screen/unlock.component';
import { IdleService } from './services/idle.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, unlockComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  showUnlock = false;
  warningSeconds?: number;

  constructor(private idleService: IdleService, private router: Router) { }

  ngOnInit() {
    // Route change watcher
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.urlAfterRedirects.includes('/login') || event.urlAfterRedirects.includes('/reset-password')) {
          
          this.idleService.stop();
          this.showUnlock = false;
          this.warningSeconds = undefined;
        } else {
          
          this.idleService.start();
        }
      });

    this.idleService.locked$.subscribe(() => {
      if (this.router.url.includes('/login') || this.router.url.includes('/reset-password')) {
        return;
      }
      this.showUnlock = true;
      this.warningSeconds = undefined;
    });

    this.idleService.warning$.subscribe((sec) => {
      if (!this.showUnlock && !this.router.url.includes('/login') && !this.router.url.includes('/reset-password')) {
        this.warningSeconds = sec;
      }
    });
  }

  onUnlocked() {
    this.showUnlock = false;
    this.warningSeconds = undefined;
    this.idleService.unlockDone();
  }

}
