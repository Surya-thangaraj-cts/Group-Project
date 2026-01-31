import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../../auth/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class AdminProfileComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  profile: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProfile(): void {
    this.profile = this.authService.getCurrentUser();
    if (!this.profile) {
      this.profile = {
        name: 'Admin User',
        userId: 'admin123',
        email: 'admin@example.com',
        branch: 'HQ',
        role: 'admin',
        status: 'active',
        password: ''
      };
    }
  }

  getFullName(): string {
    if (!this.profile) return '';
    return this.profile.name || 'Unknown';
  }

  getInitials(): string {
    if (!this.profile) return 'U';
    const parts = (this.profile.name || 'U').trim().split(/\s+/);
    return parts.map(p => p[0]).join('').toUpperCase();
  }

  closeSidebar(): void {
    this.close.emit();
  }
}
