
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild
} from '@angular/core';
import { ExistingUsersTableComponent, User as ExistingUser } from './existing-users-table/existing-users-table.component';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';

type Role = 'Officer' | 'Manager' | 'Admin';
type Status = 'Active' | 'Inactive' | 'Pending';

interface User {
  userId: string;
  name: string;
  role: Role;
  email: string;
  branch: string;
  status: Status;
}

interface ComplianceMetrics {
  totalTransactions: number;
  highValueCount: number;
  accountGrowthRate: number;
  monthlyTxnVolume: number[];
  monthlyLabels: string[];
  monthlySuspicious: number[];
  amountBuckets: { label: string; count: number }[];
  // channelMix:   { label: string; count: number }[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule,ExistingUsersTableComponent]
})
export class AdminComponent implements OnInit, AfterViewInit, OnDestroy {

  // ----- Page info -----
  currentYear = new Date().getFullYear();

  activeView: 'admin' | 'compliance' = 'admin';

  // Methods:
  showCompliance(): void { this.activeView = 'compliance'; }
  showAdmin(): void { this.activeView = 'admin'; }

  // ----- Data -----
  users: User[] = [];
  pendingUsers: User[] = [];

  // ----- Selection / editing -----
  selectedUser?: User;
  editingUserId?: string;

  // ----- Forms -----
  editUserForm: FormGroup;
  inviteUserForm: FormGroup;

  // ----- Compliance metrics -----
  compliance: ComplianceMetrics = {
    totalTransactions: 0,
    highValueCount: 0,
    accountGrowthRate: 0,
    monthlyTxnVolume: [],
    monthlyLabels: [],
    monthlySuspicious: [],
    amountBuckets: [],
    // channelMix: []
  };

  // ----- UI state -----
  searchTerm = '';
  roleFilter: Role | 'All' = 'All';

  pendingDisplayedColumns = ['userId', 'name', 'role', 'email', 'branch', 'actions'];
  usersDisplayedColumns   = ['userId', 'name', 'role', 'email', 'branch', 'status', 'actions'];

  // ----- FULL-WIDTH CHART: DOM refs & sizing -----
  @ViewChild('chartWrap') chartWrap?: ElementRef<HTMLElement>;
  chartWidth = 1200;        // will be updated to actual available width
  chartHeight = 220;        // SVG height (viewBox height)
  private resizeObs?: ResizeObserver;
  chartLeftMargin = 48;
  chartRightPadding = 8;

  plotWidth(): number {
    return Math.max(240, this.chartWidth - this.chartLeftMargin - this.chartRightPadding);
  }
  router: Router = Router.prototype;

  getYMax(): number {
    const vals = [ ...(this.compliance.monthlyTxnVolume || []), ...(this.compliance.monthlySuspicious || []) ];
    return Math.max(...vals, 1);
  }

  yTicks(count = 5): number[] {
    const max = this.getYMax();
    const step = max / (count - 1);
    const ticks: number[] = [];
    for (let i = 0; i < count; i++) {
      ticks.push(Math.round(i * step));
    }
    return ticks.reverse(); // largest first for drawing top-to-bottom
  }

  yPosInPlot(val: number, height: number): number {
    const max = this.getYMax() || 1;
    return height - (val / max) * height;
  }

  // ====== Current user for Profile UI ======
  currentUser: User | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService) {
    console.debug('[Admin] constructor');

    this.editUserForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['Officer' as Role, Validators.required],
      branch: ['', Validators.required],
      status: ['Active' as Status, Validators.required]
    });

    this.inviteUserForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['Officer' as Role, Validators.required],
      branch: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    console.debug('[Admin] ngOnInit start');
    try {
      // Load users (from AuthService or fallback demo)
      const authUsers = this.auth.getAllUsers?.() ?? [];

      // Fallback demo data (keep as-is for UX)
      if (true) {
        this.users = [
          { userId: 'U1001', name: 'Anita Sharma', role: 'Officer', email: 'anita@bank.local', branch: 'Gurgaon', status: 'Active' },
          { userId: 'U1002', name: 'Rahul Mehta', role: 'Manager', email: 'rahul@bank.local', branch: 'Delhi', status: 'Active' },
          { userId: 'U1003', name: 'Priya Nair', role: 'Officer', email: 'priya@bank.local', branch: 'Mumbai', status: 'Inactive' }
        ];

        this.pendingUsers = [
          { userId: 'U2001', name: 'Karan Singh', role: 'Officer', email: 'karan@bank.local', branch: 'Jaipur', status: 'Pending' },
          { userId: 'U2002', name: 'Neha Gupta', role: 'Manager', email: 'neha@bank.local', branch: 'Noida', status: 'Pending' }
        ];
      }
    } catch (e) {
      console.error('[Admin] ngOnInit error', e);
    }

    // Compliance demo values
    this.compliance = {
      totalTransactions: 12845,
      highValueCount: 312,
      accountGrowthRate: 9.8,
      monthlyTxnVolume:    [820, 760, 900, 1100, 980, 1200, 1400, 1350, 1500, 1600, 1550, 1700],
      monthlyLabels:       ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      monthlySuspicious:   [12, 18, 14, 21, 19, 24, 20, 22, 25, 28, 27, 30],
      amountBuckets: [
        { label: '< ₹10k',    count: 540 },
        { label: '₹10k–₹50k', count: 830 },
        { label: '₹50k–₹1L',  count: 310 },
        { label: '> ₹1L',     count: 160 },
      ],
    };

    // Start with no selection
    this.selectedUser = undefined;

    // Ensure pending approvals
    if (!this.pendingUsers || this.pendingUsers.length === 0) {
      this.pendingUsers = [
        { userId: 'U2001', name: 'Karan Singh', role: 'Officer', email: 'karan@bank.local', branch: 'Jaipur', status: 'Pending' },
        { userId: 'U2002', name: 'Neha Gupta', role: 'Manager', email: 'neha@bank.local', branch: 'Noida', status: 'Pending' }
      ];
    }

    // Populate currentUser for Profile UI
    this.currentUser = this.tryGetCurrentUserFromAuth() ?? this.deriveCurrentUser();

    console.debug('[Admin] ngOnInit end', {
      usersCount: this.users.length,
      pendingCount: this.pendingUsers.length,
      currentUser: this.currentUser
    });
  }

  /** Attempt to read current/logged-in user from AuthService (if the method exists). */
  private tryGetCurrentUserFromAuth(): User | null {
    try {
      const authUser = (this.auth as any).getCurrentUser?.();
      if (!authUser) return null;
      // Map to our UI model safely
      return {
        userId: authUser.userId ?? 'unknown',
        name: authUser.name ?? 'Unknown User',
        email: authUser.email ?? '',
        role: this.mapRole(authUser.role ?? 'Officer'),
        branch: authUser.branch ?? '',
        status: this.mapStatus(authUser.status ?? 'active'),
      };
    } catch {
      return null;
    }
  }

  /** Fallback current user: prefer first active user, or provide a sensible default. */
  private deriveCurrentUser(): User | null {
    if (this.users?.length) {
      const u = this.users.find(x => x.status === 'Active') ?? this.users[0];
      return u ? { ...u } : null;
    }
    // Default (can adjust to your environment)
    return {
      userId: 'U-1029',
      name: 'Thangaraj, Surya',
      email: 'surya.thangaraj@cognizant.com',
      role: 'Officer',
      branch: 'Pune',
      status: 'Active'
    };
  }

  /** Map the auth service role strings to admin UI-friendly roles */
  private mapRole(r: string): Role {
    switch (r) {
      case 'admin': return 'Admin';
      case 'bankManager': return 'Manager';
      case 'bankOfficer': return 'Officer';
      case 'Manager':
      case 'Officer':
      case 'Admin':
        return r as Role;
      default:
        return 'Officer';
    }
  }

  /** Map auth status values to admin UI-friendly statuses */
  private mapStatus(s: string): Status {
    switch ((s ?? '').toLowerCase()) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'pending': return 'Pending';
      default: return 'Active';
    }
  }

  ngAfterViewInit(): void {
    console.debug('[Admin] ngAfterViewInit');
    // Use ResizeObserver for accurate sizing across layout changes
    setTimeout(() => {
      const el = this.chartWrap?.nativeElement;
      if (!el) return;

      this.resizeObs = new ResizeObserver(entries => {
        for (const entry of entries) {
          // Account for element padding so the SVG width matches the visible content area
          const style = getComputedStyle(el);
          const padLeft = parseFloat(style.paddingLeft) || 0;
          const padRight = parseFloat(style.paddingRight) || 0;
          const pad = padLeft + padRight;
          const w = entry.contentRect.width;
          this.chartWidth = Math.max(360, Math.round(w - pad));
        }
      });
      this.resizeObs.observe(el);
    }, 0);
  }

  ngOnDestroy(): void {
    console.debug('[Admin] ngOnDestroy');
    this.resizeObs?.disconnect();
  }

  /** Select a user to show in the details panel */
  selectUser(u: User): void {
    this.selectedUser = { ...u };
  }

  /** Clear selection */
  clearSelected(): void {
    this.selectedUser = undefined;
  }

  /** Re-select first item from filtered list (or clear if none) */
  private reselectFirstFiltered(): void {
    const list = this.filteredUsers();
    const first = list.find(u => u.status === 'Active') ?? list[0];
    this.selectedUser = first ? { ...first } : undefined;
  }

  /** Keep selection in sync with search changes */
  onSearchChange(val: string): void {
    this.searchTerm = (val ?? '').trim();
    console.debug('[Admin] onSearchChange:', { val: this.searchTerm });
    if (this.searchTerm) {
      const list = this.filteredUsers();
      const first = list.find(u => u.status === 'Active') ?? list[0];
      this.selectedUser = first ? { ...first } : undefined;
    } else {
      this.selectedUser = undefined;
    }
  }

  /** Keep selection in sync with role changes */
  onRoleChange(val: Role | 'All'): void {
    this.roleFilter = val ?? 'All';
    if (this.searchTerm) this.reselectFirstFiltered();
  }

  // ----- Chart helpers -----

  // Single-line path (legacy)
  trendPath(width: number, height: number): string {
    const values = this.compliance.monthlyTxnVolume;
    if (!values.length) return '';
    const maxVal = Math.max(...values);
    const stepX = width / (values.length - 1);
    const points = values.map((v, i) => {
      const x = i * stepX;
      const y = height - (v / maxVal) * height;
      return `${x},${y}`;
    });
    return 'M ' + points.map(p => p.replace(',', ' ')).join(' L ');
  }

  // Generic line path for any series (used by dual line chart)
  linePath(values: number[], width = 600, height = 120): string {
    if (!values?.length) return '';
    const max = Math.max(...values) || 1;
    const stepX = width / (values.length - 1);
    const pts = values.map((v, i) => {
      const x = i * stepX;
      const y = height - (v / max) * height;
      return `${x},${y}`;
    });
    return 'M ' + pts.map(p => p.replace(',', ' ')).join(' L ');
  }

  // Max helpers for bar charts
  get maxBucket(): number {
    return Math.max(...(this.compliance.amountBuckets.map(b => b.count)), 1);
  }
  // get maxChannel(): number {
  //   return Math.max(...(this.compliance.channelMix.map(c => c.count)), 1);
  // }

  // ----- Pending approvals -----
  approveUser(u: User): void {
    const approved: User = { ...u, status: 'Active' };
    this.users.push(approved);
    this.pendingUsers = this.pendingUsers.filter(x => x.userId !== u.userId);
    // Keep selection sensible after list changes
    this.reselectFirstFiltered();
    // Persist approval to AuthService (store as lowercase auth model)
    try {
      this.auth.signup?.({
        name: approved.name,
        userId: approved.userId,
        email: approved.email,
        branch: approved.branch,
        role: this.mapRoleToAuth(approved.role),
        status: 'active'
      });
    } catch (e) {
      console.warn('Failed to persist approved user to AuthService', e);
    }
  }

  rejectUser(u: User): void {
    this.pendingUsers = this.pendingUsers.filter(x => x.userId !== u.userId);
  }

  // ----- Inline edit -----
  startEdit(u: User): void {
    this.editingUserId = u.userId;
    this.selectedUser = { ...u };
    this.editUserForm.setValue({
      name: u.name,
      email: u.email,
      role: u.role,
      branch: u.branch,
      status: u.status
    });
  }
  cancelEdit(): void {
    this.editingUserId = undefined;
    this.editUserForm.reset();
  }
  updateUser(): void {
    if (!this.selectedUser || this.editUserForm.invalid) return;
    const idx = this.users.findIndex(x => x.userId === this.selectedUser!.userId);
    if (idx !== -1) {
      const updated = { ...this.selectedUser, ...this.editUserForm.value };
      this.users[idx] = updated;
    }
    this.cancelEdit();
    // Recompute selection because list changed
    this.reselectFirstFiltered();
  }

  // ----- Invite -----
  inviteUser(): void {
    if (this.inviteUserForm.invalid) return;
    const v = this.inviteUserForm.value;
    const newUser: User = {
      userId: 'U' + Math.floor(Math.random() * 100000),
      name: v.name,
      email: v.email,
      role: v.role,
      branch: v.branch,
      status: 'Pending'
    };
    this.pendingUsers.unshift(newUser);
    this.inviteUserForm.reset();
  }

  /** Clear the search input and reset selection */
  clearSearch(ref?: HTMLInputElement): void {
    if (ref) ref.value = '';
    this.searchTerm = '';
    this.selectedUser = undefined;
  }

  /** Convert UI role back to AuthService role strings */
  private mapRoleToAuth(r: Role): string {
    switch (r) {
      case 'Admin': return 'admin';
      case 'Manager': return 'bankManager';
      case 'Officer': return 'bankOfficer';
      default: return 'bankOfficer';
    }
  }

  // ----- Filtering -----
  filteredUsers(): User[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.users
      .filter(u => (this.roleFilter === 'All' ? true : u.role === this.roleFilter))
      .filter(u =>
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.branch.toLowerCase().includes(term) ||
        u.userId.toLowerCase().includes(term)
      );
  }

  /** Existing users = everyone except Pending (Active + Inactive). */
  
  /** If you want strictly Active-only, replace the above with:
   *  return this.filteredUsers().filter(u => u.status === 'Active');
   */

  // ====== Profile helpers & actions ======

  /** Create avatar initials from full name (handles spaces/commas/hyphens). */
  initials(fullName: string): string {
    if (!fullName) return 'U';
    const cleaned = fullName.replace(/[,]+/g, ' ').trim();
    if (!cleaned) return 'U';
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts[parts.length - 1]?.charAt(0) ?? '';
    const initials = (first + last).toUpperCase();
    return initials || 'U';
  }

  /** Show my profile (offcanvas if available) and populate the details card. */
  viewMyProfile(): void {
    // Populate the details card
    if (this.currentUser) {
      this.selectUser(this.currentUser);
    }

    // Open offcanvas (Bootstrap 5 JS must be included globally or via CDN)
    const el = document.getElementById('offcanvasProfile');
    const bs = (window as any).bootstrap;
    try {
      if (el && bs?.Offcanvas) {
        const offcanvas = new bs.Offcanvas(el);
        offcanvas.show();
      }
    } catch {
      // If bootstrap JS not available, it's okay—the details card already shows info
      console.debug('Bootstrap Offcanvas not available; showing details card only.');
    }
  }

  signOut(): void {
    try {
      this.auth.logout(); // Call your AuthService logout method
      // After sign out, redirect to login page or home
      window.location.href = '/landing'; // Or use Angular Router
      // Example with Router:
      // this.router.navigate(['/login']);
    } catch (e) {
      console.error('Sign out failed', e);
    }
  }

  /** Navigate to settings (replace with Router navigation if you want). */
  goToSettings(): void {
    console.log('Go to settings...');
    // e.g., inject Router and navigate:
    // this.router.navigate(['/settings']);
  }

    showExistingOnly = false;
    
 showOnlyExisting(): void {
    this.showExistingOnly = true;
    this.selectedUser = undefined; // optional
  }

showFullAdmin(): void {
    this.showExistingOnly = false;
  }

  /** Existing users = everyone except Pending (Active + Inactive) */
  existingUsers(): User[] {
    return this.filteredUsers().filter(u => u.status !== 'Pending');
    // If you want strictly Active-only:
    // return this.filteredUsers().filter(u => u.status === 'Active');
  }
  
onExistingUserUpdated(updated: ExistingUser): void {
    const idx = this.users.findIndex(x => x.userId === updated.userId);
    if (idx !== -1) {
      this.users[idx] = { ...updated };
    }
    // Reselect a sensible user if needed
    this.reselectFirstFiltered();
  }
  
 onExistingUserSelected(u: ExistingUser): void {
    this.selectUser(u as User);
  }


openExistingUsers(): void {
  // Switch to Admin view (if currently on Compliance)
  this.activeView = 'admin';
  // Turn on existing-only mode
  this.showOnlyExisting();
}

pendingSelectedUser?: User | null = null;
openProceed(u: User): void {
  this.pendingSelectedUser = { ...u };
  try {
    const el = document.getElementById('proceedModal');
    const bs = (window as any).bootstrap;
    if (el && bs?.Modal) {
      const modal = bs.Modal.getOrCreateInstance(el);
      modal.show();
    }
  } catch {}
}


}

