import { Component } from '@angular/core';
import { DistributorLoginComponent } from '../Distributor-Login/distributor-login.component';

@Component({
  selector: 'app-sales-team-login',
  standalone: true,
  imports: [DistributorLoginComponent],
  template: '<app-distributor-login partnerRole="ST" />'
})
export class SalesTeamLoginComponent {}
