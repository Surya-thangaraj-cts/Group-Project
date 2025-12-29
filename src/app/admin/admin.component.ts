
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';

// ✅ Use the richer summary type
import { ComplianceSummary } from '../../service/types';

// ✅ Fix the path spelling (complaince → compliance)
import { ComplianceService } from '../../service/complaince.service';

// Angular Material (you can keep these even if most of your UI is native HTML)
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';


// ...imports remain the same

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

/** Extended to support dual line + bar charts */
interface ComplianceMetrics {
  totalTransactions: number;
  highValueCount: number;
  accountGrowthRate: number; // percentage
  monthlyTxnVolume: number[]; // used by trendPath() and dual line
  monthlyLabels: string[];    // ['Jan','Feb',...]
  monthlySuspicious: number[]; // NEW: suspicious flags per month

  amountBuckets: { label: string; count: number }[]; // NEW: for bar chart
  channelMix:   { label: string; count: number }[];  // NEW: for bar chart
}

@Component({
  selector: 'app-admin',
  standalone: true,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
    // (Material imports optional; remove if fully native)
  ]
})
export class AdminComponent implements OnInit {

  // Users (unchanged)
  users: User[] = [];
  pendingUsers: User[] = [];

  // Inline edit state (unchanged)
  selectedUser?: User;
  editingUserId?: string;

  // Forms (unchanged)
  editUserForm: FormGroup;
  inviteUserForm: FormGroup;

  // ✅ Extended compliance metrics
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

  // UI state (unchanged)
  searchTerm = '';
  roleFilter: Role | 'All' = 'All';

  // Columns arrays (kept even for native tables)
  pendingDisplayedColumns = ['userId', 'name', 'role', 'email', 'branch', 'actions'];
  usersDisplayedColumns   = ['userId', 'name', 'role', 'email', 'branch', 'status', 'actions'];

  constructor(private fb: FormBuilder) {
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
    // Demo data — replace with API calls later
    this.users = [
      { userId: 'U1001', name: 'Anita Sharma', role: 'Officer', email: 'anita@bank.local', branch: 'Gurgaon', status: 'Active' },
      { userId: 'U1002', name: 'Rahul Mehta', role: 'Manager', email: 'rahul@bank.local', branch: 'Delhi', status: 'Active' },
      { userId: 'U1003', name: 'Priya Nair', role: 'Officer', email: 'priya@bank.local', branch: 'Mumbai', status: 'Inactive' }
    ];

    this.pendingUsers = [
      { userId: 'U2001', name: 'Karan Singh', role: 'Officer', email: 'karan@bank.local', branch: 'Jaipur', status: 'Pending' },
      { userId: 'U2002', name: 'Neha Gupta', role: 'Manager', email: 'neha@bank.local', branch: 'Noida', status: 'Pending' }
    ];

    // ✅ Extended compliance demo values (keep same length for labels/series)
    this.compliance = {
      totalTransactions: 12845,
      highValueCount: 312,
      accountGrowthRate: 9.8,
      monthlyTxnVolume:    [820, 760, 900, 1100, 980, 1200, 1400, 1350, 1500, 1600, 1550, 1700],
      monthlyLabels:       ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      monthlySuspicious:   [12,   18,   14,   21,   19,   24,   20,   22,   25,   28,   27,   30], // NEW

      amountBuckets: [
        { label: '< ₹10k',      count: 540 },
        { label: '₹10k–₹50k',   count: 830 },
        { label: '₹50k–₹1L',    count: 310 },
        { label: '> ₹1L',       count: 160 },
      ],
      channelMix: [
        { label: 'UPI',    count: 980 },
        { label: 'NEFT',   count: 620 },
        { label: 'RTGS',   count: 210 },
        { label: 'Cash',   count: 150 },
        { label: 'Cheque', count: 70 },
      ]
    };
  }

  // Pending approvals (unchanged)
  approveUser(u: User): void {
    const approved: User = { ...u, status: 'Active' };
    this.users.push(approved);
    this.pendingUsers = this.pendingUsers.filter(x => x.userId !== u.userId);
  }

  rejectUser(u: User): void {
    this.pendingUsers = this.pendingUsers.filter(x => x.userId !== u.userId);
  }

  // Edit user inline (unchanged)
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
    this.selectedUser = undefined;
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
  }

  // Invite/create user (unchanged)
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

  // Filtering helpers (unchanged)
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

  /* =========================
     Chart helpers (Dual line + Bars)
     ========================= */

  // Existing single-line path (kept)
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

  // NEW: generic polyline path for any series (used by dual line chart)
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

  // NEW: max helpers for bar charts
  get maxBucket(): number {
    return Math.max(...(this.compliance.amountBuckets.map(b => b.count)), 1);
  }
  get maxChannel(): number {
    return Math.max(...(this.compliance.channelMix.map(c => c.count)), 1);
  }
}
