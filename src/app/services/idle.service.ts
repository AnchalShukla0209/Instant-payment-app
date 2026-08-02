import { Injectable, NgZone } from '@angular/core';
import { fromEvent, merge, interval, Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class IdleService {
    private activitySub?: Subscription;
    private checkSub?: Subscription;

    public locked$ = new Subject<void>();
    public warning$ = new Subject<number>();

    public isLocked = false;
    private lastActivity = Date.now();

    //   private readonly IDLE_MS = 60 * 1000;    // 1 minute for testing
    //   private readonly WARNING_MS = 30 * 1000; // 30 seconds warning

    private readonly IDLE_MS = 10 * 60 * 1000;    // 1 minute for testing
    private readonly WARNING_MS = 1 * 60 * 1000; // 30 seconds warning
    private warningCountdown?: number;
    private warningRunning = false;

    constructor(private ngZone: NgZone) {
        const savedLast = localStorage.getItem('lastActivity');
        const wasLocked = localStorage.getItem('isLocked') === 'true';
        const now = Date.now();

        if (savedLast) {
            this.lastActivity = parseInt(savedLast, 10);
        } else {
            this.lastActivity = now;
            localStorage.setItem('lastActivity', this.lastActivity.toString());
        }

        const idleTime = now - this.lastActivity;
        if (wasLocked || idleTime >= this.IDLE_MS) {
            this.isLocked = true;
            this.ngZone.run(() => {
                setTimeout(() => this.locked$.next(), 0);
            });
        }

        // ❌ Do not start here
    }

    private saveState() {
        localStorage.setItem('isLocked', this.isLocked ? 'true' : 'false');
        localStorage.setItem('lastActivity', this.lastActivity.toString());
    }

    unlockDone() {
        this.isLocked = false;
        this.warningRunning = false;
        this.warningCountdown = undefined;
        this.lastActivity = Date.now();
        this.saveState();
    }

    private checkIdle() {
        if (this.isLocked) return;

        const now = Date.now();
        const idleTime = now - this.lastActivity;
        const warnAt = this.IDLE_MS - this.WARNING_MS;

        if (idleTime >= warnAt && idleTime < this.IDLE_MS && !this.warningRunning) {
            this.warningRunning = true;
            this.startWarningCountdown(this.IDLE_MS - idleTime);
        }

        if (idleTime >= this.IDLE_MS) {
            this.isLocked = true;
            this.warningRunning = false;
            this.warningCountdown = undefined;
            this.saveState();
            this.ngZone.run(() => this.locked$.next());
        }
    }

    private startWarningCountdown(duration: number) {
        this.warningCountdown = Math.ceil(duration / 1000);

        const tick = () => {
            if (this.isLocked) return;
            this.ngZone.run(() => this.warning$.next(this.warningCountdown!));
            if (--this.warningCountdown! > 0 && !this.isLocked) {
                setTimeout(tick, 1000);
            } else {
                this.warningCountdown = undefined;
                this.warningRunning = false;
            }
        };

        tick();
    }

    public start() {
        this.stop(); // prevent duplicate subscriptions
        this.ngZone.runOutsideAngular(() => {
            const activity$ = merge(
                fromEvent(document, 'mousemove'),
                fromEvent(document, 'click'),
                fromEvent(document, 'keydown'),
                fromEvent(document, 'touchstart')
            ).pipe(debounceTime(200));

            this.activitySub = activity$.subscribe(() => {
                if (!this.isLocked) {
                    this.lastActivity = Date.now();
                    localStorage.setItem('lastActivity', this.lastActivity.toString());
                }
            });
        });

        this.ngZone.runOutsideAngular(() => {
            this.checkSub = interval(1000).subscribe(() => this.checkIdle());
        });
    }

    public stop() {
        this.activitySub?.unsubscribe();
        this.checkSub?.unsubscribe();
    }
}
