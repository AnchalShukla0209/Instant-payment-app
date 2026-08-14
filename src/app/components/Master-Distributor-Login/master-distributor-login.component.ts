import { Component } from '@angular/core';
import { DistributorLoginComponent } from '../Distributor-Login/distributor-login.component';

@Component({
  selector: 'app-master-distributor-login',
  standalone: true,
  imports: [DistributorLoginComponent],
  template: '<app-distributor-login partnerRole="MD" />'
})
export class MasterDistributorLoginComponent {}
