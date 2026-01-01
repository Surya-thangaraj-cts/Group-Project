
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild
} from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';


// import { ComplianceService } from '../../service/compliance.service';

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
  channelMix:   { label: string; count: number }[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class AdminComponent implements OnInit, AfterViewInit, OnDestroy {

  // ----- Page info -----
  currentYear = new Date().getFullYear();

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
    channelMix: []
  };

  // ----- UI state -----
  searchTerm = '';
  roleFilter: Role | 'All' = 'All';
  // Theme is finalized; styles are applied globally within component via CSS variables

  pendingDisplayedColumns = ['userId', 'name', 'role', 'email', 'branch', 'actions'];
  usersDisplayedColumns   = ['userId', 'name', 'role', 'email', 'branch', 'status', 'actions'];

  // ----- FULL-WIDTH CHART: DOM refs & sizing -----
  @ViewChild('chartWrap') chartWrap?: ElementRef<HTMLElement>;
  chartWidth = 1200;        // will be updated to actual available width
  chartHeight = 220;        // SVG height (viewBox height)
  private resizeObs?: ResizeObserver;

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
      // Try to load persisted users from AuthService (users created via sign-up)
      const authUsers = this.auth.getAllUsers();
      if (authUsers && authUsers.length) {
      // Map AuthService users to the Admin view model
      this.users = authUsers.map(u => ({
        userId: u.userId,
        name: u.name,
        role: this.mapRole(u.role),
        email: u.email,
        branch: u.branch,
        status: this.mapStatus(u.status)
      }));
    } else {
      // Fallback demo data
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

    }
    catch (e) {
      console.error('[Admin] ngOnInit error', e);
    }

    // Extended compliance demo values (keep same length for labels/series)
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
      channelMix: [
        { label: 'UPI',    count: 980 },
        { label: 'NEFT',   count: 620 },
        { label: 'RTGS',   count: 210 },
        { label: 'Cash',   count: 150 },
        { label: 'Cheque', count: 70 },
      ]
    };

    // Start with no selection; selection happens only when the admin starts a search
    this.selectedUser = undefined;

    // Ensure we always have pending approvals for the admin UX
    if (!this.pendingUsers || this.pendingUsers.length === 0) {
      this.pendingUsers = [
        { userId: 'U2001', name: 'Karan Singh', role: 'Officer', email: 'karan@bank.local', branch: 'Jaipur', status: 'Pending' },
        { userId: 'U2002', name: 'Neha Gupta', role: 'Manager', email: 'neha@bank.local', branch: 'Noida', status: 'Pending' }
      ];
    }
    console.debug('[Admin] ngOnInit end', { usersCount: this.users.length, pendingCount: this.pendingUsers.length });
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
    switch (s.toLowerCase()) {
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
          // Compute horizontal paddings from computed styles so the SVG width
          // matches the visible content area precisely (handles different breakpoints)
          const style = getComputedStyle(el);
          const padLeft = parseFloat(style.paddingLeft) || 0;
          const padRight = parseFloat(style.paddingRight) || 0;
          const pad = padLeft + padRight;
          const w = entry.contentRect.width;
          // Subtract only the element padding (not an arbitrary constant)
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
    // Prefer first Active if available; otherwise first
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

  // ----- Existing helpers -----

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
  get maxChannel(): number {
    return Math.max(...(this.compliance.channelMix.map(c => c.count)), 1);
  }

  // ----- Pending approvals -----
  approveUser(u: User): void {
    const approved: User = { ...u, status: 'Active' };
    this.users.push(approved);
    this.pendingUsers = this.pendingUsers.filter(x => x.userId !== u.userId);
    // Keep selection sensible after list changes
    this.reselectFirstFiltered();
    // Persist approval to AuthService (store as lowercase auth model)
    try {
      this.auth.signup({
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
}
