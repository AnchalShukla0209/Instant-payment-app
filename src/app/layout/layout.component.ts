import { Component,HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';
import { HeaderComponent } from '../layout/header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  sidebarVisible = true;

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }
   isMobileScreen(): boolean {
    return window.innerWidth < 768;
  }

  @HostListener('window:resize')
  onResize() {
    if (this.isMobileScreen()) {
      this.sidebarVisible = false;
    } else {
      this.sidebarVisible = true;
    }
  }
}
