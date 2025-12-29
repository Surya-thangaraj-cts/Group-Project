import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../auth/auth.service';

@Component({
  selector: 'app-manager-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './manager-shell.component.html',
  styleUrls: ['./manager-shell.component.css']
})
export class ManagerShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  currentUser: User | null = this.auth.getCurrentUser();
  

  logout() {
    this.auth.logout();
    this.router.navigate(['/landing']);
  }
}
