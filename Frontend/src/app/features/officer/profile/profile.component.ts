import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficerService } from '../officer.service';
import { OfficerProfile } from '../model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  profile: OfficerProfile | null = null;
  private destroy$ = new Subject<void>();

  constructor(private officerService: OfficerService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProfile(): void {
    this.officerService.getOfficerProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile: OfficerProfile) => {
          this.profile = profile;
        },
        error: (err: any) => {
          console.error('Profile loading error:', err);
        }
      });
  }

  getFullName(): string {
    if (!this.profile) return '';
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }

  getInitials(): string {
    if (!this.profile) return 'U';
    const parts = `${this.profile.firstName} ${this.profile.lastName}`.trim().split(/\s+/);
    return parts.map(p => p[0]).join('').toUpperCase();
  }

  closeSidebar(): void {
    this.close.emit();
  }
}
