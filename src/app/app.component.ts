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
        if (event.urlAfterRedirects.includes('/login')) {
          console.log('[AppComponent] On login page → stop idleService');
          this.idleService.stop();
          this.showUnlock = false;
          this.warningSeconds = undefined;
        } else {
          console.log('[AppComponent] On protected page → start idleService');
          this.idleService.start();
        }
      });

    this.idleService.locked$.subscribe(() => {
      if (this.router.url.includes('/login')) {
        console.log('[AppComponent] Skipped for Login');
        return;
      }
      console.log('[AppComponent] Popup opened');
      this.showUnlock = true;
      this.warningSeconds = undefined;
    });

    this.idleService.warning$.subscribe((sec) => {
      console.log('[AppComponent] Warning seonds start' + sec);
      if (!this.showUnlock && !this.router.url.includes('/login')) {
        this.warningSeconds = sec;
      }
    });
  }

  onUnlocked() {
    console.log('[AppComponent] onUnlocked called');
    this.showUnlock = false;
    this.warningSeconds = undefined;
    this.idleService.unlockDone();
  }

}
