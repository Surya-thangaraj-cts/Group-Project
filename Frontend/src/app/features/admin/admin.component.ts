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
import { AdminService } from './services/admin.service';
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
  // inviteUserForm: FormGroup;
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
    private adminService: AdminService,
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
 
    // this.inviteUserForm = this.fb.group({
    //   name: ['', Validators.required],
    //   email: ['', [Validators.required, Validators.email]],
    //   role: ['Officer' as Role, Validators.required],
    //   branch: ['', Validators.required]
    // });
 
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
    // Load existing users from API (no local storage)
    this.loadExistingUsersFromApi();

    // Load pending users from API
    this.loadPendingUsersFromApi();

    // Initialize empty compliance data - will be populated from API
    this.compliance = {
      totalTransactions: 0,
      highValueCount: 0,
      accountGrowthRate: 0,
      monthlyTxnVolume:  [],
      monthlyLabels:     [],
      monthlySuspicious: [],
      amountBuckets: [],
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

  /**
   * Load pending users from API
   */
  private loadPendingUsersFromApi(): void {
    this.adminService.getPendingUsers().subscribe({
      next: (users) => {
        this.pendingUsers = users.map(u => ({
          userId: u.userId,
          name: u.name,
          email: u.email,
          branch: u.branch,
          role: u.role as Role,
          status: u.status as Status
        }));
        console.log('Loaded pending users from API:', this.pendingUsers);
      },
      error: (error) => {
        console.error('Failed to load pending users from API:', error);
        // Fallback to local storage if API fails
        this.loadPendingUsersFromAuth();
      }
    });
  }

  /**
   * Load pending users from local AuthService (fallback)
   */
  private loadPendingUsersFromAuth(): void {
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
    } catch (e) {
      console.error('[Admin] Failed to load pending users from AuthService', e);
    }
  }

  /**
   * Load existing users (Active/Inactive) from API
   */
  private loadExistingUsersFromApi(): void {
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.map(u => ({
          userId: u.userId,
          name: u.name,
          email: u.email,
          branch: u.branch,
          role: u.role as Role,
          status: u.status as Status
        }));
        console.log('Loaded approved users from API:', this.users);
      },
      error: (error) => {
        console.warn('⚠️ GET /api/admin/approved-users failed');
        console.warn('✅ Using manually updated user list until endpoint is ready');
        // Keep existing users array (contains approved/rejected users from UI actions)
        // Don't clear it - this preserves users added via approve/reject buttons
      }
    });
  }

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
 
      // Only load existing (non-pending) users from local storage
      // Pending users are loaded from API
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
    this.adminService.approveUser(u.userId).subscribe({
      next: (response) => {
        console.log('User approved:', response.message);
        
        // Remove from pending list
        this.pendingUsers = this.pendingUsers.filter(user => user.userId !== u.userId);
        
        // Immediately add to existing users with Active status
        const approvedUser: User = {
          ...u,
          status: 'Active'
        };
        // Add to beginning of array for visibility
        this.users.unshift(approvedUser);
        
        // Also update in AuthService for login functionality
        this.auth.approveUser(u.userId);
        
        // Refresh pending list from API
        this.loadPendingUsersFromApi();
        
        // Try to refresh existing users from API (will update when endpoint is ready)
        this.loadExistingUsersFromApi();
      },
      error: (error) => {
        console.error('Failed to approve user:', error);
        alert(`Failed to approve user: ${error.message}`);
      }
    });
  }
 
  rejectUser(u: User): void {
    this.adminService.deactivateUser(u.userId).subscribe({
      next: (response) => {
        console.log('User rejected/deactivated:', response.message);
        
        // Remove from pending list
        this.pendingUsers = this.pendingUsers.filter(user => user.userId !== u.userId);
        
        // Immediately add to existing users with Inactive status
        const rejectedUser: User = {
          ...u,
          status: 'Inactive'
        };
        // Add to beginning of array for visibility
        this.users.unshift(rejectedUser);
        
        // Also update in AuthService for login functionality
        this.auth.rejectUser(u.userId);
        
        // Refresh pending list from API
        this.loadPendingUsersFromApi();
        
        // Try to refresh existing users from API (will update when endpoint is ready)
        this.loadExistingUsersFromApi();
      },
      error: (error) => {
        console.error('Failed to reject user:', error);
        alert(`Failed to reject user: ${error.message}`);
      }
    });
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
    if (!this.editingUser || this.editUserForm.invalid) {
      console.warn('Cannot save: editingUser or form invalid', {
        editingUser: this.editingUser,
        formValid: this.editUserForm.valid,
        formValue: this.editUserForm.value
      });
      return;
    }
    
    const formValue = this.editUserForm.value;
    const userId = this.editingUser.userId;
    
    const editRequest = {
      name: formValue.name,
      email: formValue.email,
      branch: formValue.branch,
      role: formValue.role
    };
    
    console.log('🔄 Sending edit request:', {
      userId,
      request: editRequest,
      endpoint: `PUT /api/admin/edit/${userId}`
    });
    
    // Call API to update user
    this.adminService.editUser(userId, editRequest).subscribe({
      next: (response) => {
        console.log('✅ User updated successfully:', response.message);
        console.log('Updated user data from API:', response.user);
        
        // Refresh the existing users table from API
        this.loadExistingUsersFromApi();
        
        // Update selected user if it was this one
        if (this.selectedUser?.userId === userId) {
          this.selectedUser = {
            userId: response.user.userId,
            name: response.user.name,
            email: response.user.email,
            branch: response.user.branch,
            role: response.user.role as Role,
            status: response.user.status as Status
          };
        }
        
        // Close modal
        this.editingUser = undefined;
        this.editUserForm.reset();
        
        alert('User updated successfully!');
      },
      error: (error) => {
        console.error('❌ Failed to update user:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          fullError: error
        });
        alert(`Failed to update user: ${error.message}`);
      }
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
  private saveUsers() {
    localStorage.setItem('users', JSON.stringify(this.users));
  }
 
  updateUser(): void {
    if (!this.selectedUser || this.editUserForm.invalid) {
      console.warn('Cannot update: selectedUser or form invalid', {
        selectedUser: this.selectedUser,
        formValid: this.editUserForm.valid,
        formValue: this.editUserForm.value
      });
      return;
    }
 
    const formValue = this.editUserForm.value;
    const userId = this.selectedUser.userId;
    
    const editRequest = {
      name: formValue.name,
      email: formValue.email,
      branch: formValue.branch,
      role: formValue.role
    };
    
    console.log('🔄 Sending inline edit request:', {
      userId,
      request: editRequest,
      endpoint: `PUT /api/admin/edit/${userId}`
    });
    
    // Call API to update user
    this.adminService.editUser(userId, editRequest).subscribe({
      next: (response) => {
        console.log('✅ User updated successfully:', response.message);
        console.log('Updated user data from API:', response.user);
        
        // Refresh the existing users table from API
        this.loadExistingUsersFromApi();
        
        // Update selected user
        this.selectedUser = {
          userId: response.user.userId,
          name: response.user.name,
          email: response.user.email,
          branch: response.user.branch,
          role: response.user.role as Role,
          status: response.user.status as Status
        };
        
        this.cancelEdit();
        alert('User updated successfully!');
      },
      error: (error) => {
        console.error('❌ Failed to update user:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          fullError: error
        });
        alert(`Failed to update user: ${error.message}`);
      }
    });
  }
 
  // -------------------------------
  //  Existing Users table events
  // -------------------------------
  onExistingUserUpdated(updated: ExistingUser): void {
    const u = updated as User;
 
    console.log('🔄 User updated from table:', u);
    
    // Check if status changed
    const originalUser = this.users.find(user => user.userId === u.userId);
    const statusChanged = originalUser && originalUser.status !== u.status;
    
    if (statusChanged) {
      // Status change - use approve/deactivate endpoint
      if (u.status === 'Inactive') {
        this.adminService.deactivateUser(u.userId).subscribe({
          next: (response) => {
            console.log('✅ User deactivated:', response.message);
            this.loadExistingUsersFromApi();
            alert('User status updated to Inactive!');
          },
          error: (error) => {
            console.error('❌ Failed to deactivate user:', error);
            alert(`Failed to update status: ${error.message}`);
            this.loadExistingUsersFromApi();
          }
        });
        return;
      } else if (u.status === 'Active') {
        this.adminService.approveUser(u.userId).subscribe({
          next: (response) => {
            console.log('✅ User activated:', response.message);
            this.loadExistingUsersFromApi();
            alert('User status updated to Active!');
          },
          error: (error) => {
            console.error('❌ Failed to activate user:', error);
            alert(`Failed to update status: ${error.message}`);
            this.loadExistingUsersFromApi();
          }
        });
        return;
      }
    }
    
    // Regular field update (name, email, role, branch)
    this.adminService.editUser(u.userId, {
      name: u.name,
      email: u.email,
      branch: u.branch,
      role: u.role
    }).subscribe({
      next: (response) => {
        console.log('✅ User updated successfully in database:', response.message);
        
        // Refresh the existing users table from API
        this.loadExistingUsersFromApi();
        
        // Update selected user if it was this one
        if (this.selectedUser?.userId === u.userId) {
          this.selectedUser = {
            userId: response.user.userId,
            name: response.user.name,
            email: response.user.email,
            branch: response.user.branch,
            role: response.user.role as Role,
            status: response.user.status as Status
          };
        }
        
        alert('User updated successfully!');
      },
      error: (error) => {
        console.error('❌ Failed to update user in database:', error);
        alert(`Failed to update user: ${error.message}`);
        
        // Reload from API to revert any UI changes
        this.loadExistingUsersFromApi();
      }
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
 
 