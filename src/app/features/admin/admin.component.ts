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
import { AdminProfileComponent } from './profile/profile.component';
import { AuthService } from '../../auth/auth.service';
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

/**
 * User interface for Admin console
 * Represents both existing and pending users in the system
 */
interface User {
  userId: string;
  name: string;
  role: Role;
  email: string;
  branch: string;
  status: Status;
}interface ComplianceMetrics {
  totalTransactions: number;
  highValueCount: number;
  accountGrowthRate: number;
  monthlyTxnVolume: number[];
  monthlyLabels: string[];
  monthlySuspicious: number[];
  amountBuckets: { label: string; count: number }[];
}
 
/**
 * Admin Console Component
 * 
 * Manages user administration, approval workflows, and compliance monitoring.
 * Provides dual views:
 * - Admin View: User management, pending approvals, existing users table
 * - Compliance View: KPIs, monthly volume charts, transaction analysis
 * 
 * Features:
 * - User approval/rejection workflow
 * - User data editing and management
 * - Real-time compliance metrics
 * - Advanced search and filtering
 * - Profile management
 * 
 * @component
 * @standalone
 * @selector app-admin
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ExistingUsersTableComponent, AdminProfileComponent]
})
export class AdminComponent implements OnInit, AfterViewInit, OnDestroy {
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
  editingUser?: User;  // for modal editing
  pendingSearchTerm: string = '';  // for pending users search
 
  // ----- Forms -----
  editUserForm: FormGroup;
  inviteUserForm: FormGroup;
  myDetailsForm: FormGroup;
 
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

  // ====== Profile sidebar state ======
  showProfile: boolean = false;

  // ====== Profile dropdown menu state ======
  isProfileMenuOpen: boolean = false;
 
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
 
    this.myDetailsForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['']
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
        { label: '< ₹10k',    count: 450 },
        { label: '₹10k–₹50k', count: 80 },
        { label: '₹50k–₹1L',  count: 250 },
        { label: '> ₹1L',     count: 150 },
      ],
    };
 
    // Populate currentUser for Profile UI
    this.currentUser = this.tryGetCurrentUserFromAuth() ?? this.deriveCurrentUser();
 
    // Populate myDetailsForm with current user data
    if (this.currentUser) {
      this.myDetailsForm.patchValue({
        name: this.currentUser.name,
        email: this.currentUser.email,
        phone: '',
        address: ''
      });
    }
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
 
  // Pie chart colors
  private pieColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

  getPieColors(): string[] {
    return this.pieColors;
  }

  // Calculate pie chart slices
  getPieSlices(): any[] {
    const buckets = this.compliance.amountBuckets || [];
    if (buckets.length === 0) return [];

    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    const slices: any[] = [];
    let currentAngle = -90; // Start at top

    buckets.forEach((bucket, i) => {
      const percent = Math.round((bucket.count / total) * 100);
      const sliceAngle = (bucket.count / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;

      // Convert angles to radians
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      // Calculate start and end points
      const x1 = 125 + 100 * Math.cos(startRad);
      const y1 = 125 + 100 * Math.sin(startRad);
      const x2 = 125 + 100 * Math.cos(endRad);
      const y2 = 125 + 100 * Math.sin(endRad);

      // Large arc flag (1 if angle > 180)
      const largeArc = sliceAngle > 180 ? 1 : 0;

      // SVG path for the slice
      const path = `M 125 125 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`;

      // Calculate label position (at midpoint of arc, 70% radius)
      const midAngle = (startRad + endRad) / 2;
      const labelRadius = 70;
      const labelX = 125 + labelRadius * Math.cos(midAngle);
      const labelY = 125 + labelRadius * Math.sin(midAngle);

      slices.push({
        path,
        color: this.pieColors[i % this.pieColors.length],
        percent,
        labelX,
        labelY
      });

      currentAngle = endAngle;
    });

    return slices;
  }
 
  // -------------------------------
  //  Pending approvals
  // -------------------------------
  approveUser(u: User): void {
    try {
      this.auth.approveUser(u.userId);            // ✅ persist: status -> active
      // Refresh lists from source of truth
      this.refreshFromAuth();
    } catch (e) {
      console.warn('Failed to approve user', e);
    }
  }
 
  rejectUser(u: User): void {
    try {
      this.auth.rejectUser(u.userId);             // ✅ persist: status -> inactive
      this.refreshFromAuth();
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
 
  /** Open modal for editing user */
  openEditModal(u: User): void {
    this.editingUser = { ...u };
    this.editUserForm.setValue({
      name: u.name,
      email: u.email,
      role: u.role,
      branch: u.branch,
      status: u.status
    });
  }
 
  /** Save changes from modal and update user in list */
  saveEditedUser(): void {
    if (!this.editingUser || this.editUserForm.invalid) return;
    const idx = this.users.findIndex(x => x.userId === this.editingUser!.userId);
    if (idx !== -1) {
      const updated = { ...this.editingUser, ...this.editUserForm.value };
      this.users[idx] = updated;
      this.selectedUser = { ...updated };
     
      // Update auth service to handle inactive user logout
      const authStatus = updated.status === 'Active' ? 'active' : updated.status === 'Inactive' ? 'inactive' : 'pending';
      this.auth.updateUserStatus(updated.userId, authStatus as any);
    }
    this.editingUser = undefined;
    this.editUserForm.reset();
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
  private saveUsers() {
    localStorage.setItem('users', JSON.stringify(this.users));
  }
 
  updateUser(): void {
    if (!this.selectedUser || this.editUserForm.invalid) return;
 
    const idx = this.users.findIndex(x => x.userId === this.selectedUser!.userId);
    if (idx !== -1) {
      const updated: User = { ...this.selectedUser, ...this.editUserForm.value };
 
      if (updated.status === 'Pending') {
        // UI flow to move to Pending (optional)
        this.moveToPending(updated);
      }if(updated.status === 'Inactive' ) {
        // this.moveToPending(updated)
        const user = this.users.find(u => u.userId === updated.userId);
        if (!user) return;
         user.status = 'Inactive';
         this.saveUsers();
      }
       else {
        // Keep in existing users
        this.users[idx] = updated;
        this.pendingUsers = this.pendingUsers.filter(p => p.userId !== updated.userId);
      }
    }
 
    this.cancelEdit();
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
   
    // Update auth service with full user details
    const authStatus = u.status === 'Active' ? 'active' : u.status === 'Inactive' ? 'inactive' : 'pending';
    this.auth.updateUser(u.userId, {
      name: u.name,
      email: u.email,
      role: u.role,
      branch: u.branch,
      status: authStatus as any
    });
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
 
  openProfile(): void {
    this.showProfile = true;
  }

  closeProfile(): void {
    this.showProfile = false;
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  signOut(): void {
    try {
      this.auth.signout();
      this.router.navigate(['/home']);
    } catch (e) {
      console.error('Sign out failed', e);
    }
  }  goToSettings(): void {
    console.log('Go to settings...');
    // this.router.navigate(['/settings']);
  }
 
  /** Submit a request to change user details */
  submitDetailsChangeRequest(): void {
    if (!this.myDetailsForm.valid || !this.currentUser) return;
 
    const detailsRequest = {
      userId: this.currentUser.userId,
      requestedChanges: this.myDetailsForm.value,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };
 
    // Store the request in localStorage
    const existingRequests = JSON.parse(localStorage.getItem('detailChangeRequests') || '[]');
    existingRequests.push(detailsRequest);
    localStorage.setItem('detailChangeRequests', JSON.stringify(existingRequests));
 
    // Show success message
    alert('Your details change request has been submitted for admin approval!');
 
    // Close the modal
    const modal = document.getElementById('editMyDetailsModal');
    if (modal) {
      const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
      bootstrapModal?.hide();
    }
 
    // Reset form
    this.myDetailsForm.reset({
      name: this.currentUser.name,
      email: this.currentUser.email,
      phone: '',
      address: ''
    });
  }
 
  // -------------------------------
  //  Tracking helpers
  // -------------------------------
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
 
 
  /** Existing users = everyone except Pending (Active + Inactive) */
  existingUsers(): User[] {
    return this.users.filter(u => u.status !== 'Pending');
  }
 
  /** Filter pending users by search term */
  getFilteredPendingUsers(): User[] {
    let filtered = this.pendingUsers;
    
    if (this.pendingSearchTerm.trim()) {
      const term = this.pendingSearchTerm.toLowerCase();
      filtered = this.pendingUsers.filter(u =>
        u.userId.toLowerCase().includes(term) ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term) ||
        u.branch.toLowerCase().includes(term)
      );
    }
    
    // Return in reverse order so newest requests appear at the top
    return filtered.slice().reverse();
  }
 
  /** Clear pending users search */
  clearPendingSearch(): void {
    this.pendingSearchTerm = '';
  }
}
 
 