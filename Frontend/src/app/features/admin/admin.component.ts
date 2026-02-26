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
  // Expose Math to template
  Math = Math;
  
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

  // ----- Pagination for Existing Users -----
  currentPage: number = 1;
  pageSize: number = 10;
  totalUsers: number = 0;
  totalPages: number = 0;
 
  // ----- Selection / editing -----
  selectedUser?: User;
  editingUserId?: string;
  editingUser?: User;  // for modal editing
  pendingSearchTerm: string = '';  // for pending users search
  existingSearchTerm: string = '';  // for existing users search
 
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

    // Load compliance metrics from API
    this.loadComplianceMetrics();
 
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
      },
      error: (error) => {
        console.error('Failed to load pending users from API');
        alert('Failed to load pending users. Please refresh the page.');
      }
    });
  }

  /**
   * Load existing users (Active/Inactive) from API with pagination
   */
  private loadExistingUsersFromApi(pageNumber?: number): void {
    const page = pageNumber || this.currentPage;
    console.log('Loading existing users - requesting page:', page, 'pageSize:', this.pageSize);
    this.adminService.getAllUsers(page, this.pageSize).subscribe({
      next: (response: any) => {
        console.log('Existing users API response:', response);
        // Handle both paginated response and direct array response
        let items = response.items || response || [];
        console.log('Items received from backend:', items.length);
        
        // Backend workaround: If backend returns more items than pageSize, slice it
        if (items.length > this.pageSize) {
          console.warn('Backend returned more items than pageSize. Slicing to pageSize.');
          items = items.slice(0, this.pageSize);
        }
        
        console.log('Items to map:', items.length);
        this.users = items.map((u: any) => ({
          userId: u.userId,
          name: u.name,
          email: u.email,
          branch: u.branch,
          role: u.role as Role,
          status: u.status as Status
        }));
        this.totalUsers = response.totalCount || items.length;
        this.currentPage = response.pageNumber || page;
        this.pageSize = response.pageSize || this.pageSize;
        this.totalPages = response.totalPages || Math.ceil(this.totalUsers / this.pageSize);
        console.log('Loaded users:', this.users.length, 'Current page:', this.currentPage, 'Total pages:', this.totalPages);
      },
      error: (error) => {
        console.error('Failed to load approved users from API', error);
        alert('Failed to load users. Please refresh the page.');
      }
    });
  }

  /**
   * Load compliance metrics from API
   */
  private loadComplianceMetrics(): void {
    console.log('Loading compliance metrics from API...');
    this.adminService.getComplianceMetrics().subscribe({
      next: (metrics) => {
        console.log('Compliance metrics received from API:', metrics);
        this.compliance = {
          totalTransactions: metrics.totalTransactions,
          highValueCount: metrics.highValueCount,
          accountGrowthRate: metrics.accountGrowthRate,
          monthlyTxnVolume: metrics.monthlyTxnVolume,
          monthlyLabels: metrics.monthlyLabels,
          monthlySuspicious: metrics.monthlySuspicious,
          amountBuckets: metrics.amountBuckets
        };
        console.log('Compliance metrics updated:', this.compliance);
      },
      error: (error) => {
        console.error('Failed to load compliance metrics:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          url: 'https://localhost:7021/api/admin/compliance-metrics'
        });
        alert(`Failed to load compliance metrics: ${error.message}\n\nPlease ensure:\n1. Backend API is running on port 7021\n2. You are logged in as Admin\n3. JWT token is valid`);
      }
    });
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
    // Return null if no users - will be populated when API loads
    return null;
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
 
  // Generic line path for any series - uses shared Y-axis scale
  linePath(values: number[], width = 600, height = 120): string {
    if (!values?.length) return '';
    const max = this.getYMax(); // Use shared max for both lines
    const stepX = values.length > 1 ? width / (values.length - 1) : 0;
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
        // Refresh both lists from API
        this.loadPendingUsersFromApi();
        this.loadExistingUsersFromApi();
      },
      error: (error) => {
        console.error('Failed to approve user');
        alert(`Failed to approve user: ${error.message}`);
      }
    });
  }
 
  rejectUser(u: User): void {
    this.adminService.deactivateUser(u.userId).subscribe({
      next: (response) => {
        // Refresh both lists from API
        this.loadPendingUsersFromApi();
        this.loadExistingUsersFromApi();
      },
      error: (error) => {
        console.error('Failed to reject user');
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
    
    // Call API to update user
    this.adminService.editUser(userId, editRequest).subscribe({
      next: (response) => {
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
        console.error('Failed to update user');
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
    // Removed - no longer needed as we fetch from API
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
    
    // Call API to update user
    this.adminService.editUser(userId, editRequest).subscribe({
      next: (response) => {
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
        console.error('Failed to update user');
        alert(`Failed to update user: ${error.message}`);
      }
    });
  }
 
  // -------------------------------
  //  Existing Users table events
  // -------------------------------
  onExistingUserUpdated(updated: ExistingUser): void {
    const u = updated as User;
    
    // Check if status changed
    const originalUser = this.users.find(user => user.userId === u.userId);
    const statusChanged = originalUser && originalUser.status !== u.status;
    
    if (statusChanged) {
      // Status change - use approve/deactivate endpoint
      if (u.status === 'Inactive') {
        this.adminService.deactivateUser(u.userId).subscribe({
          next: (response) => {
            this.loadExistingUsersFromApi();
            alert('User status updated to Inactive!');
          },
          error: (error) => {
            console.error('Failed to deactivate user');
            alert(`Failed to update status: ${error.message}`);
            this.loadExistingUsersFromApi();
          }
        });
        return;
      } else if (u.status === 'Active') {
        this.adminService.approveUser(u.userId).subscribe({
          next: (response) => {
            this.loadExistingUsersFromApi();
            alert('User status updated to Active!');
          },
          error: (error) => {
            console.error('Failed to activate user');
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
        console.error('Failed to update user in database');
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
  }

  goToSettings(): void {
    console.log('Go to settings...');
    // this.router.navigate(['/settings']);
  }

  submitDetailsChangeRequest(): void {
    if (this.myDetailsForm.invalid) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    const formValue = this.myDetailsForm.value;
    console.log('Details change request submitted:', formValue);
    
    // TODO: Implement API call to submit profile change request
    alert('Profile update request submitted successfully!');
    
    // Close the profile sidebar
    this.closeProfile();
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
    // Return in reverse order so newest requests appear at the top
    return this.pendingUsers.slice().reverse();
  }
 
  /** Clear pending users search */
  clearPendingSearch(): void {
    this.pendingSearchTerm = '';
    this.loadPendingUsersFromApi(); // Reload all pending users
  }

  /** Search pending users via API */
  onPendingSearchChange(): void {
    const query = this.pendingSearchTerm.trim();
    
    if (!query) {
      this.loadPendingUsersFromApi();
      return;
    }

    this.adminService.searchPendingUsers(query).subscribe({
      next: (users) => {
        this.pendingUsers = users.map(u => ({
          userId: u.userId,
          name: u.name,
          email: u.email,
          branch: u.branch,
          role: u.role as Role,
          status: u.status as Status
        }));
      },
      error: (error) => {
        console.error('Failed to search pending users');
        alert(`Search failed: ${error.message}`);
      }
    });
  }

  /** Search existing users via API with pagination */
  onExistingSearchChange(query?: string): void {
    // If query is provided (from child component), use it; otherwise use existingSearchTerm
    const searchQuery = query !== undefined ? query : this.existingSearchTerm.trim();
    
    // If query is empty, load regular paginated users instead of searching
    if (!searchQuery) {
      this.loadExistingUsersFromApi(1);
      return;
    }
    
    this.adminService.searchApprovedUsers(searchQuery, 1, this.pageSize).subscribe({
      next: (response) => {
        this.users = response.items.map(u => ({
          userId: u.userId,
          name: u.name,
          email: u.email,
          branch: u.branch,
          role: u.role as Role,
          status: u.status as Status
        }));
        // Reset pagination when searching
        this.currentPage = 1;
        this.totalUsers = response.totalCount;
        this.totalPages = response.totalPages;
      },
      error: (error) => {
        console.error('Failed to search approved users');
        alert(`Search failed: ${error.message}`);
      }
    });
  }

  /** Clear existing users search */
  clearExistingSearch(): void {
    this.existingSearchTerm = '';
    this.loadExistingUsersFromApi(); // Reload all existing users
  }

  // -------------------------------
  //  Pagination methods for Existing Users
  // -------------------------------
  goToPage(page: number): void {
    console.log('goToPage called with page:', page, 'totalPages:', this.totalPages);
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      console.log('Calling loadExistingUsersFromApi for page:', page);
      this.loadExistingUsersFromApi(page);
    } else {
      console.log('Page out of range:', page);
    }
  }

  nextPage(): void {
    console.log('nextPage called - currentPage:', this.currentPage, 'totalPages:', this.totalPages);
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    console.log('previousPage called - currentPage:', this.currentPage);
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
}
 
 