import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SalesTeamOnboardingService } from './sales-team-onboarding.service';
import { AdminOnboardingService } from './admin-onboarding.service';

describe('Sales Team onboarding API contracts', () => {
  let http: HttpTestingController;
  let sales: SalesTeamOnboardingService;
  let admin: AdminOnboardingService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});
    http=TestBed.inject(HttpTestingController);sales=TestBed.inject(SalesTeamOnboardingService);admin=TestBed.inject(AdminOnboardingService);
  });
  afterEach(()=>http.verify());

  it('sends common search, status, date and pagination filters', () => {
    sales.list({pageIndex:2,pageSize:10,search:'PAN123',status:'Approved',fromDate:'2026-08-01',toDate:'2026-08-18'}).subscribe();
    const request=http.expectOne(r=>r.url.endsWith('/v1/sales-team/onboardings'));
    expect(request.request.params.get('pageIndex')).toBe('2');
    expect(request.request.params.get('search')).toBe('PAN123');
    expect(request.request.params.get('status')).toBe('Approved');
    expect(request.request.params.get('fromDate')).toBe('2026-08-01');
    expect(request.request.params.get('toDate')).toBe('2026-08-18');
    request.flush({success:true,data:{data:[],totalCount:0,pageIndex:2,pageSize:10}});
  });

  it('uses the secured historical document endpoint', () => {
    sales.documentVersion(42,99).subscribe();
    const request=http.expectOne(r=>r.url.endsWith('/42/document-versions/99/file'));
    expect(request.request.responseType).toBe('blob');request.flush(new Blob());
  });

  it('uses the explicit credential retry endpoint', () => {
    admin.retryCredentialEmail(42).subscribe();
    const request=http.expectOne(r=>r.url.endsWith('/42/retry-credential-email'));
    expect(request.request.method).toBe('POST');request.flush({success:true,data:{}});
  });
});
