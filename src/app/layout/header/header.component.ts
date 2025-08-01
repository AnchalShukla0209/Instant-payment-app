import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {

  username = '';
  constructor(private authService: AuthService) {}

ngOnInit(): void {
  this.username = this.authService.getUsername();
  console.log('Header loaded - Username:', this.username);
}

}
