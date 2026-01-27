import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild
} from '@angular/core';
import {
  ExistingUsersTableComponent,
  User as ExistingUser
} from './existing-users-table/existing-users-table.component';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
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
}

@Component({
  selector: 'app-admin',
  standalone: true,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ExistingUsersTableComponent]
})
export class AdminComponent implements OnInit, AfterViewInit, OnDestroy {
  // ----- Page info -----
  currentYear = new Date().getFullYear();

  activeView: 'admin' | 'compliance' = 'admin';
  showCompliance(): void { this.activeView = 'compliance'; }
  showAdmin(): void {
    this.activeView = 'admin';
    this.showFullAdmin();
    this.editingUserId = undefined;
  }

  // ----- Data -----
  users: User[] = [];         // existing = Active/Inactive
  pendingUsers: User[] = [];  // Pending only

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
  };

  // ----- UI state -----
  searchTerm = '';
  roleFilter: Role | 'All' = 'All';

  pendingDisplayedColumns = ['userId', 'name', 'role', 'email', 'branch', 'actions'];
  usersDisplayedColumns   = ['userId', 'name', 'role', 'email', 'branch', 'status', 'actions'];

  // ----- FULL-WIDTH CHART: DOM refs & sizing -----
  @ViewChild('chartWrap') chartWrap?: ElementRef<HTMLElement>;
  chartWidth = 1200;  // updated at runtime
  chartHeight = 220;
  private resizeObs?: ResizeObserver;
  chartLeftMargin = 48;
  chartRightPadding = 8;

  plotWidth(): number {
    return Math.max(240, this.chartWidth - this.chartLeftMargin - this.chartRightPadding);
  }

  getYMax(): number {
    const vals = [
      ...(this.compliance.monthlyTxnVolume || []),
      ...(this.compliance.monthlySuspicious || [])
    ];
    return Math.max(...vals, 1);
  }

  yTicks(count = 7): number[] {
    const max = this.getYMax();
    const step = max / (count - 1);
    const ticks: number[] = [];
    for (let i = 0; i < count; i++) ticks.push(Math.round(i * step));
    return ticks.reverse();
  }

  yPosInPlot(val: number, height: number): number {
    const max = this.getYMax() || 1;
    return height - (val / max) * height;
  }

  // ====== Current user for Profile UI ======
  currentUser: User | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    // Reactive forms
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

  // -------------------------------
  //  Lifecycle
  // -------------------------------
  ngOnInit(): void {
    // Load users from AuthService (split into existing vs pending)
    this.refreshFromAuth();

    // Demo compliance values (you can replace with API)
    this.compliance = {
      totalTransactions: 12845,
      highValueCount: 312,
      accountGrowthRate: 9.8,
      monthlyTxnVolume:  [820, 760, 900, 1100, 980, 1200, 1400, 1350, 1500, 1600, 1550, 1700],
      monthlyLabels:     ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      monthlySuspicious: [700, 860, 820, 1050, 980, 1200, 1100, 1180, 1250, 1380, 1320, 1460], // demo matching axis scale
      amountBuckets: [
        { label: '< ₹10k',    count: 540 },
        { label: '₹10k–₹50k', count: 830 },
        { label: '₹50k–₹1L',  count: 310 },
        { label: '> ₹1L',     count: 160 },
      ],
    };

    // Populate currentUser for Profile UI
    this.currentUser = this.tryGetCurrentUserFromAuth() ?? this.deriveCurrentUser();
  }

  ngAfterViewInit(): void {
    // Accurate sizing across layout/container changes
    setTimeout(() => {
      const el = this.chartWrap?.nativeElement;
      if (!el) return;

      this.resizeObs = new ResizeObserver(entries => {
        for (const entry of entries) {
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
    this.resizeObs?.disconnect();
  }

  // -------------------------------
  //  Auth ↔ UI mapping & loading
  // -------------------------------
  private refreshFromAuth(): void {
    try {
      const authUsers = this.auth.getAllUsers();
      const mapped: User[] = (authUsers || []).map(u => ({
        userId: (u.userId ?? '').toString(),
        name: u.name ?? '',
        email: u.email ?? '',
        branch: u.branch ?? '',
        role: this.mapRole(u.role ?? 'bankOfficer'),
        status: this.mapStatus(u.status ?? 'active'),
      }));

      this.pendingUsers = mapped.filter(u => u.status === 'Pending');
      this.users = mapped.filter(u => u.status !== 'Pending');

      // Ensure there is at least something for first render (optional demo)
      if (!mapped.length) {
        // If no users in storage (rare), seed demo existing users
        this.users = [
          { userId: 'U1001', name: 'Anita Sharma', role: 'Officer', email: 'anita@bank.local', branch: 'Gurgaon', status: 'Active' },
          { userId: 'U1002', name: 'Rahul Mehta', role: 'Manager', email: 'rahul@bank.local', branch: 'Delhi', status: 'Active' },
          { userId: 'U1003', name: 'Priya Nair', role: 'Officer', email: 'priya@bank.local', branch: 'Mumbai', status: 'Inactive' }
        ];
      }
    } catch (e) {
      console.error('[Admin] Failed to load users from AuthService', e);
    }
  }

  /** Attempt to read current/logged-in user from AuthService and map to UI model */
  private tryGetCurrentUserFromAuth(): User | null {
    try {
      const authUser = (this.auth as any).getCurrentUser?.();
      if (!authUser) return null;
      return {
        userId: authUser.userId ?? 'unknown',
        name: authUser.name ?? 'Unknown User',
        email: authUser.email ?? '',
        role: this.mapRole(authUser.role ?? 'bankOfficer'),
        branch: authUser.branch ?? '',
        status: this.mapStatus(authUser.status ?? 'active'),
      };
    } catch {
      return null;
    }
  }

  /** Fallback current user: prefer first active user */
  private deriveCurrentUser(): User | null {
    if (this.users?.length) {
      const u = this.users.find(x => x.status === 'Active') ?? this.users[0];
      return u ? { ...u } : null;
    }
    return {
      userId: 'U-1029',
      name: 'Thangaraj, Surya',
      email: 'surya.thangaraj@cognizant.com',
      role: 'Officer',
      branch: 'Pune',
      status: 'Active'
    };
  }

  /** Map auth roles to UI roles */
  private mapRole(r: string): Role {
    switch (r) {
      case 'admin':        return 'Admin';
      case 'bankManager':  return 'Manager';
      case 'bankOfficer':  return 'Officer';
      case 'Manager':
      case 'Officer':
      case 'Admin':
        return r as Role;
      default:
        return 'Officer';
    }
  }

  /** Map auth statuses to UI statuses */
  private mapStatus(s: string): Status {
    switch ((s ?? '').toLowerCase()) {
      case 'active':   return 'Active';
      case 'inactive': return 'Inactive';
      case 'pending':  return 'Pending';
      default:         return 'Active';
    }
  }

  // -------------------------------
  //  Selection & filters
  // -------------------------------
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

  // -------------------------------
  //  Chart helpers
  // -------------------------------
  // Legacy single-line path
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

  // Generic line path for any series
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

  // Amount bucket helpers for width & max
  get maxBucket(): number {
    const counts = this.compliance.amountBuckets?.map(b => b.count) ?? [1];
    return Math.max(...counts, 1);
  }
  bucketPercent(count: number): number {
    const max = this.maxBucket || 1;
    return Math.max(2, Math.round((count / max) * 100)); // min 2% so tiny bars stay visible
  }

  // -------------------------------
  //  Pending approvals
  // -------------------------------
  approveUser(u: User): void {
    try {
      this.auth.approveUser(u.userId);            // ✅ persist: status -> active
      // Refresh lists from source of truth
      this.refreshFromAuth();
      this.reselectFirstFiltered();
    } catch (e) {
      console.warn('Failed to approve user', e);
    }
  }

  rejectUser(u: User): void {
    try {
      this.auth.rejectUser(u.userId);             // ✅ persist: status -> inactive
      this.refreshFromAuth();
      this.reselectFirstFiltered();
    } catch (e) {
      console.warn('Failed to reject user', e);
    }
  }

  // -------------------------------
  //  Inline edit (parent panel)
  // -------------------------------
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

  /** Move a user to pending and remove from existing users list (UI-only action) */
  private moveToPending(updated: User): void {
    // Remove from existing users
    this.users = this.users.filter(u => u.userId !== updated.userId);

    // Upsert into pending
    const idx = this.pendingUsers.findIndex(p => p.userId === updated.userId);
    const pendingVersion: User = { ...updated, status: 'Pending' };
    if (idx === -1) this.pendingUsers.unshift(pendingVersion);
    else this.pendingUsers[idx] = pendingVersion;

    if (this.selectedUser?.userId === updated.userId) this.selectedUser = undefined;
  }

  updateUser(): void {
    if (!this.selectedUser || this.editUserForm.invalid) return;

    const idx = this.users.findIndex(x => x.userId === this.selectedUser!.userId);
    if (idx !== -1) {
      const updated: User = { ...this.selectedUser, ...this.editUserForm.value };

      if (updated.status === 'Pending') {
        // UI flow to move to Pending (optional)
        this.moveToPending(updated);
      } else {
        // Keep in existing users
        this.users[idx] = updated;
        this.pendingUsers = this.pendingUsers.filter(p => p.userId !== updated.userId);
      }
    }

    this.cancelEdit();
    this.reselectFirstFiltered();
  }

  // -------------------------------
  //  Existing Users table events
  // -------------------------------
  onExistingUserUpdated(updated: ExistingUser): void {
    const u = updated as User;

    if (u.status === 'Pending') {
      this.moveToPending(u);
    } else {
      const idx = this.users.findIndex(x => x.userId === u.userId);
      if (idx !== -1) this.users[idx] = { ...u };
      else this.users.push({ ...u });
      this.pendingUsers = this.pendingUsers.filter(p => p.userId !== u.userId);
    }

    this.reselectFirstFiltered();
  }

  onExistingUserSelected(u: ExistingUser): void {
    this.selectUser(u as User);
  }

  // -------------------------------
  //  View toggles
  // -------------------------------
  showExistingOnly = false;

  showOnlyExisting(): void {
    this.showExistingOnly = true;
    this.selectedUser = undefined;
  }

  showFullAdmin(): void {
    this.showExistingOnly = false;
  }

  openExistingUsers(): void {
    this.activeView = 'admin';
    this.showOnlyExisting();
  }

  // -------------------------------
  //  Profile / offcanvas / modals
  // -------------------------------
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

  /** Create avatar initials from full name (handles spaces/commas/hyphens). */
  initials(fullName: string): string {
    if (!fullName) return 'U';
    const cleaned = fullName.replace(/[,]+/g, ' ').trim();
    if (!cleaned) return 'U';
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts[parts.length - 1]?.charAt(0) ?? '';
    const initials = (first + last).toUpperCase();
    return initials || 'U';
  }

  viewMyProfile(): void {
    if (this.currentUser) {
      this.selectUser(this.currentUser);
    }
    const el = document.getElementById('offcanvasProfile');
    const bs = (window as any).bootstrap;
    try {
      if (el && bs?.Offcanvas) {
        const offcanvas = new bs.Offcanvas(el);
        offcanvas.show();
      }
    } catch { /* no-op */ }
  }

  signOut(): void {
    try {
      this.auth.signout();
      this.router.navigate(['/landing']);
    } catch (e) {
      console.error('Sign out failed', e);
    }
  }

  goToSettings(): void {
    console.log('Go to settings...');
    // this.router.navigate(['/settings']);
  }

  // -------------------------------
  //  Search helpers
  // -------------------------------
  clearSearch(ref?: HTMLInputElement): void {
    if (ref) ref.value = '';
    this.searchTerm = '';
    this.selectedUser = undefined;
  }
  
trackByUserId(index: number, u: User): string {
  return (u.userId ?? '').toString();
}
private dedupeUsers(arr: User[]): User[] {
  const map = new Map<string, User>();
  for (const u of arr) {
    const key = (u.userId ?? '').trim().toLowerCase();
    if (!key) continue;
    map.set(key, { ...map.get(key), ...u }); // latest wins
  }
  return Array.from(map.values());
}


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

  /** Existing users = everyone except Pending (Active + Inactive) */
  existingUsers(): User[] {
    return this.filteredUsers().filter(u => u.status !== 'Pending');
  }
}
