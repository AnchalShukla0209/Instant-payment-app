import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobalLoaderService {
  private activeRequests = 0;
  private shownAt = 0;
  private hideTimer?: ReturnType<typeof setTimeout>;
  private readonly minimumVisibleMs = 300;
  private readonly loadingSubject = new BehaviorSubject(false);
  readonly loading$ = this.loadingSubject.asObservable();

  show(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
    this.activeRequests++;
    if (!this.loadingSubject.value) {
      this.shownAt = Date.now();
      this.loadingSubject.next(true);
    }
  }

  hide(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.activeRequests !== 0) return;

    const remaining = Math.max(0, this.minimumVisibleMs - (Date.now() - this.shownAt));
    this.hideTimer = setTimeout(() => {
      this.hideTimer = undefined;
      if (this.activeRequests !== 0) return;

      // Wait until Angular has applied the API response to the DOM before hiding.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (this.activeRequests === 0) this.loadingSubject.next(false);
      }));
    }, remaining);
  }
}
