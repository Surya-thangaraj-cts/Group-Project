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

  users: User[] = [];         // existing = Active/Inactive
  pendingUsers: User[] = [];  // Pending only

  currentPage: number = 1;
  pageSize: number = 10;
  totalUsers: number = 0;
  totalPages: number = 0;

  selectedUser?: User;
  editingUserId?: string;
  editingUser?: User;  // for modal editing
  pendingSearchTerm: string = '';  // for pending users search
  existingSearchTerm: string = '';  // for existing users search

  editUserForm: FormGroup;
  myDetailsForm: FormGroup;

  compliance: ComplianceMetrics = {
    totalTransactions: 0,
    highValueCount: 0,
    accountGrowthRate: 0,
    monthlyTxnVolume: [],
    monthlyLabels: [],
    monthlySuspicious: [],
    amountBuckets: [],
  };

  pendingDisplayedColumns = ['userId', 'name', 'role', 'email', 'branch', 'actions'];
  usersDisplayedColumns   = ['userId', 'name', 'role', 'email', 'branch', 'status', 'actions'];

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

  currentUser: User | null = null;

  showProfile: boolean = false;
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

    this.myDetailsForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['']
    });
  }

  ngOnInit(): void {
    this.loadExistingUsersFromApi();
    this.loadPendingUsersFromApi();
    this.loadComplianceMetrics();
    this.currentUser = this.tryGetCurrentUserFromAuth() ?? this.deriveCurrentUser();

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

  private loadPendingUsersFromApi(): void {
    this.adminService.getPendingUsers().subscribe({
      next: (arr) => {
        this.pendingUsers = arr.map(u => ({
          userId: u.userId,
          name: u.name,
          email: u.email,
          branch: u.branch,
          role: this.mapRole(u.role),
          status: this.mapStatus(u.status)
        }));
      },
      error: () => {
        alert('Failed to load pending users. Please refresh the page.');
      }
    });
  }

  private loadExistingUsersFromApi(pageNumber?: number): void {
    const page = pageNumber || this.currentPage;

    this.adminService.getAllUsers(page, this.pageSize).subscribe({
      next: (paged) => {
        const items = paged.items ?? [];
        this.users = items.map((u: any) => ({
          userId: u.userId,
          name: u.name,
          email: u.email,
          branch: u.branch,
          role: this.mapRole(u.role),
          status: this.mapStatus(u.status)
        }));

        this.totalUsers  = paged.totalCount;
        this.currentPage = paged.pageNumber;
        this.pageSize    = paged.pageSize;
        this.totalPages  = paged.totalPages;
      },
      error: (error) => {
        alert('Failed to load users. Please refresh the page.');
      }
    });
  }

  private loadComplianceMetrics(): void {
    this.adminService.getComplianceMetrics().subscribe({
      next: (metrics) => {
        this.compliance = {
          totalTransactions: metrics.totalTransactions,
          highValueCount: metrics.highValueCount,
          accountGrowthRate: metrics.accountGrowthRate,
          monthlyTxnVolume: metrics.monthlyTxnVolume,
          monthlyLabels: metrics.monthlyLabels,
          monthlySuspicious: metrics.monthlySuspicious,
          amountBuckets: metrics.amountBuckets
        };
      },
      error: (error) => {
        alert(`Failed to load compliance metrics: ${error.message}\n\nPlease ensure:\n1. Backend API is running on port 7021\n2. You are logged in as Admin\n3. JWT token is valid`);
      }
    });
  }

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

  private deriveCurrentUser(): User | null {
    if (this.users?.length) {
      const u = this.users.find(x => x.status === 'Active') ?? this.users[0];
      return u ? { ...u } : null;
    }
    return null;
  }

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

  private mapStatus(s: string): Status {
    switch ((s ?? '').toLowerCase()) {
      case 'active':   return 'Active';
      case 'inactive': return 'Inactive';
      case 'pending':  return 'Pending';
      default:         return 'Active';
    }
  }

  selectUser(u: User): void {
    this.selectedUser = { ...u };
  }

  clearSelected(): void {
    this.selectedUser = undefined;
  }

  trendPath(width: number, height: number): string {
    const values = this.compliance.monthlyTxnVolume;
    if (!values.length) return '';
    const maxVal = Math.max(...values);
    const stepX = values.length > 1 ? width / (values.length - 1) : 0;
    const points = values.map((v, i) => {
      const x = i * stepX;
      const y = height - (v / maxVal) * height;
      return `${x},${y}`;
    });
    return 'M ' + points.map(p => p.replace(',', ' ')).join(' L ');
  }

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

  private pieColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
  getPieColors(): string[] { return this.pieColors; }

  getPieSlices(): any[] {
    const buckets = this.compliance.amountBuckets || [];
    if (buckets.length === 0) return [];

    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    const slices: any[] = [];
    let currentAngle = -90;

    buckets.forEach((bucket, i) => {
      const percent = Math.round((bucket.count / total) * 100);
      const sliceAngle = (bucket.count / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = 125 + 100 * Math.cos(startRad);
      const y1 = 125 + 100 * Math.sin(startRad);
      const x2 = 125 + 100 * Math.cos(endRad);
      const y2 = 125 + 100 * Math.sin(endRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;

      const path = `M 125 125 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`;

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

  approveUser(u: User): void {
    this.adminService.approveUser(u.userId).subscribe({
      next: () => {
        this.loadPendingUsersFromApi();
        this.loadExistingUsersFromApi();
      },
      error: (error) => {
        alert(`Failed to approve user: ${error.message}`);
      }
    });
  }

  rejectUser(u: User): void {
    this.adminService.deactivateUser(u.userId).subscribe({
      next: () => {
        this.loadPendingUsersFromApi();
        this.loadExistingUsersFromApi();
      },
      error: (error) => {
        alert(`Failed to reject user: ${error.message}`);
      }
    });
  }

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

  saveEditedUser(): void {
    if (!this.editingUser || this.editUserForm.invalid) return;

    const formValue = this.editUserForm.value;
    const userId = this.editingUser.userId;

    const editRequest = {
      name: formValue.name,
      email: formValue.email,
      branch: formValue.branch,
      role: formValue.role
    };

    this.adminService.editUser(userId, editRequest).subscribe({
      next: (response) => {
        this.loadExistingUsersFromApi();

        if (this.selectedUser?.userId === userId && response?.user) {
          this.selectedUser = {
            userId: response.user.userId,
            name: response.user.name,
            email: response.user.email,
            branch: response.user.branch,
            role: this.mapRole(response.user.role),
            status: this.mapStatus(response.user.status)
          };
        }

        this.editingUser = undefined;
        this.editUserForm.reset();

        alert('User updated successfully!');
      },
      error: (error) => {
        alert(`Failed to update user: ${error.message}`);
      }
    });
  }

  cancelEdit(): void {
    this.editingUserId = undefined;
    this.editUserForm.reset();
  }

  updateUser(): void {
    if (!this.selectedUser || this.editUserForm.invalid) return;

    const formValue = this.editUserForm.value;
    const userId = this.selectedUser.userId;

    const editRequest = {
      name: formValue.name,
      email: formValue.email,
      branch: formValue.branch,
      role: formValue.role
    };

    this.adminService.editUser(userId, editRequest).subscribe({
      next: (response) => {
        this.loadExistingUsersFromApi();

        if (response?.user) {
          this.selectedUser = {
            userId: response.user.userId,
            name: response.user.name,
            email: response.user.email,
            branch: response.user.branch,
            role: this.mapRole(response.user.role),
            status: this.mapStatus(response.user.status)
          };
        }

        this.cancelEdit();
        alert('User updated successfully!');
      },
      error: (error) => {
        alert(`Failed to update user: ${error.message}`);
      }
    });
  }

  onExistingUserUpdated(updated: ExistingUser): void {
    const u = updated as User;

    const originalUser = this.users.find(user => user.userId === u.userId);
    const statusChanged = originalUser && originalUser.status !== u.status;

    if (statusChanged) {
      if (u.status === 'Inactive') {
        this.adminService.deactivateUser(u.userId).subscribe({
          next: () => {
            this.loadExistingUsersFromApi();
            alert('User status updated to Inactive!');
          },
          error: (error) => {
            alert(`Failed to update status: ${error.message}`);
            this.loadExistingUsersFromApi();
          }
        });
        return;
      } else if (u.status === 'Active') {
        this.adminService.approveUser(u.userId).subscribe({
          next: () => {
            this.loadExistingUsersFromApi();
            alert('User status updated to Active!');
          },
          error: (error) => {
            alert(`Failed to update status: ${error.message}`);
            this.loadExistingUsersFromApi();
          }
        });
        return;
      }
    }

    this.adminService.editUser(u.userId, {
      name: u.name,
      email: u.email,
      branch: u.branch,
      role: u.role
    }).subscribe({
      next: (response) => {
        this.loadExistingUsersFromApi();

        if (this.selectedUser?.userId === u.userId && response?.user) {
          this.selectedUser = {
            userId: response.user.userId,
            name: response.user.name,
            email: response.user.email,
            branch: response.user.branch,
            role: this.mapRole(response.user.role),
            status: this.mapStatus(response.user.status)
          };
        }

        alert('User updated successfully!');
      },
      error: (error) => {
        alert(`Failed to update user: ${error.message}`);
        this.loadExistingUsersFromApi();
      }
    });
  }

  onExistingUserSelected(u: ExistingUser): void {
    this.selectUser(u as User);
  }

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

  openProfile(): void { this.showProfile = true; }
  closeProfile(): void { this.showProfile = false; }
  toggleProfileMenu(): void { this.isProfileMenuOpen = !this.isProfileMenuOpen; }

  signOut(): void {
    try {
      this.auth.signout();
      this.router.navigate(['/home']);
    } catch { }
  }

  goToSettings(): void { }

  submitDetailsChangeRequest(): void {
    if (this.myDetailsForm.invalid) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    const formValue = this.myDetailsForm.value;
    alert('Profile update request submitted successfully!');

    // Close the profile sidebar
    this.closeProfile();
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

  existingUsers(): User[] {
    return this.users.filter(u => u.status !== 'Pending');
  }

  getFilteredPendingUsers(): User[] {
    return this.pendingUsers.slice().reverse();
  }

  clearPendingSearch(): void {
    this.pendingSearchTerm = '';
    this.loadPendingUsersFromApi();
  }

  onPendingSearchChange(): void {
    const query = this.pendingSearchTerm.trim();

    if (!query) {
      this.loadPendingUsersFromApi();
      return;
    }

    this.adminService.searchPendingUsers(query).subscribe({
      next: (arr) => {
        this.pendingUsers = arr.map(u => ({
          userId: u.userId,
          name: u.name,
          email: u.email,
          branch: u.branch,
          role: this.mapRole(u.role),
          status: this.mapStatus(u.status)
        }));
      },
      error: (error) => {
        alert(`Search failed: ${error.message}`);
      }
    });
  }

  onExistingSearchChange(query?: string): void {
    const searchQuery = query !== undefined ? query : this.existingSearchTerm.trim();

    if (!searchQuery) {
      this.loadExistingUsersFromApi(1);
      return;
    }

    this.adminService.searchApprovedUsers(searchQuery, 1, this.pageSize).subscribe({
      next: (paged) => {
        const arr = paged.items ?? [];
        this.users = arr.map(u => ({
          userId: u.userId,
          name: u.name,
          email: u.email,
          branch: u.branch,
          role: this.mapRole(u.role),
          status: this.mapStatus(u.status)
        }));
        this.currentPage = 1;
        this.totalUsers  = paged.totalCount;
        this.totalPages  = paged.totalPages;
      },
      error: (error) => {
        alert(`Search failed: ${error.message}`);
      }
    });
  }

  clearExistingSearch(): void {
    this.existingSearchTerm = '';
    this.loadExistingUsersFromApi();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadExistingUsersFromApi(page);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
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