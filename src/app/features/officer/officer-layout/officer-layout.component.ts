  import { Component, HostListener, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { OfficerService } from '../officer.service';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { AlertMsg } from '../model';
import { AuthService, User } from '../../../auth/auth.service';
 
@Component({
  selector: 'officer-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './officer-layout.component.html',
  styleUrls: ['../officer-theme.css'],
})
export class OfficerLayoutComponent implements OnInit, OnDestroy {
  private officerSvc = inject(OfficerService);
 
  currentUser: User | null = null;
 
  isMobileNavOpen = false;
  isProfileMenuOpen = false;
 
  // Global alert stream
  alert$: Observable<AlertMsg | null> = this.officerSvc.alert$;
 
  // Notifications count
  unreadCount$: Observable<number> = this.officerSvc.notifications$.pipe(
    map(list => (Array.isArray(list) ? list.filter(n => !n.read).length : 0))
  );
 
  // Auto-dismiss alert
  private alertSub?: Subscription;
  private alertTimer?: any;
  private readonly ALERT_TIMEOUT_MS = 5000;
 
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}
 
  ngOnInit(): void {
    this.currentUser = this.auth.currentUser;
 
    // Auto-close alert after 5 seconds whenever a new alert appears
    this.alertSub = this.alert$.subscribe(alert => {
      if (this.alertTimer) {
        clearTimeout(this.alertTimer);
        this.alertTimer = undefined;
      }
      if (alert) {
        this.alertTimer = setTimeout(() => this.clearAlert(), this.ALERT_TIMEOUT_MS);
      }
    });
  }
 
  ngOnDestroy(): void {
    if (this.alertSub) this.alertSub.unsubscribe();
    if (this.alertTimer) clearTimeout(this.alertTimer);
  }
 
  initials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  }
 
  toggleMobileNav(ev?: Event) {
    if (ev) ev.stopPropagation();
    this.isMobileNavOpen = !this.isMobileNavOpen;
  }
  closeMobileNav() {
    this.isMobileNavOpen = false;
  }
 
  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }
 
  logout(event: Event): void {
    event.stopPropagation();
    this.auth.signout();
    this.currentUser = null;
    this.router.navigate(['/landing']);
  }
 
  clearAlert(): void {
    this.officerSvc.clearAlert();
  }
 
  @HostListener('document:click', ['$event'])
  closeOverlays(ev?: MouseEvent) {
    const target = ev?.target as HTMLElement | undefined;
    const isDropdown = target?.closest('.dropdown-menu, [data-bs-toggle="dropdown"]');
    const isOffcanvas = target?.closest('.offcanvas, [data-bs-toggle="offcanvas"]');
    const isHamburger = target?.closest('.hamburger');
 
    if (isDropdown || isOffcanvas || isHamburger) return;
 
    this.isProfileMenuOpen = false;
    this.isMobileNavOpen = false;
  }
 
  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth > 900 && this.isMobileNavOpen) this.isMobileNavOpen = false;
  }
 
  selectUser(user: User): void {
    if (user) this.currentUser = user;
  }
}
 
 
 