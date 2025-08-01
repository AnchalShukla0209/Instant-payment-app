import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { provideHttpClient,withInterceptorsFromDi ,HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from '../src/app/services/auth.interceptor';


bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [provideRouter(routes), provideToastr(),provideAnimations(),provideHttpClient(),provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }]
});
