import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  username = '';
  usertype ='';
    constructor(private authService: AuthService) {}
  ngOnInit(): void {
  this.username = this.authService.getUsername();
  this.usertype = this.authService.getUsertype();
  
}
  
}