
// src/app/features/officer/officer-layout/officer-layout.component.ts
import { Component, HostListener, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { OfficerService } from '../officer.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AlertMsg } from '../model';
import { AuthService, User } from '../../../auth/auth.service';

@Component({
  selector: 'officer-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './officer-layout.component.html',
  styleUrls: ['../officer-theme.css'],
  // encapsulation: ViewEncapsulation.None
})
export class OfficerLayoutComponent implements OnInit {
  private officerSvc = inject(OfficerService);

  currentUser: User | null = null;

  // UI state
  isMobileNavOpen = false;
  isProfileMenuOpen = false;

  // streams
  alert$: Observable<AlertMsg | null> = this.officerSvc.alert$;

  // NEW: Notifications (unread count for badge)
  unreadCount$: Observable<number> = this.officerSvc.notifications$.pipe(
    map(list => (Array.isArray(list) ? list.filter(n => !n.read).length : 0))
  );

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.currentUser;
  }

  initials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  }

  /* Mobile nav */
  toggleMobileNav(ev?: Event) {
    if (ev) ev.stopPropagation();
    this.isMobileNavOpen = !this.isMobileNavOpen;
  }
  closeMobileNav() {
    this.isMobileNavOpen = false;
  }

  /* Profile menu */
  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  logout(event: Event): void {
    event.stopPropagation();
    this.auth.logout();
    this.currentUser = null;
    this.router.navigate(['/landing']);
  }

  clearAlert(): void {
    this.officerSvc.clearAlert();
  }

  // Close overlays on outside click
  @HostListener('document:click')
  closeOverlays() {
    this.isProfileMenuOpen = false;
    this.isMobileNavOpen = false;
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth > 900 && this.isMobileNavOpen) this.isMobileNavOpen = false;
  }

  selectUser(user: User): void {
    if (user) {
      this.currentUser = user;
    }
  }

  // goToSettings(): void {
  //   this.router.navigate(['/settings']);
  // }
}
