 
// existing-users-table.component.ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
 
export type Role = 'Officer' | 'Manager' | 'Admin';
export type Status = 'Active' | 'Inactive' | 'Pending';
 
export interface User {
  userId: string;
  name: string;
  role: Role;
  email: string;
  branch: string;
  status: Status;
}
 
@Component({
  selector: 'app-existing-users-table',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './existing-users-table.component.html',
  styleUrls: ['./existing-users-table.component.css']
})
export class ExistingUsersTableComponent implements OnInit {
  /** Parent supplies the non-Pending rows */
  @Input() rows: User[] = [];
 
  /** Emit events back to parent */
  @Output() selectUser = new EventEmitter<User>();
  @Output() updateUser = new EventEmitter<User>();
 
  editingUserId?: string;
  editForm!: FormGroup;
  searchTerm: string = '';
 
  constructor(private fb: FormBuilder) {}
 
  ngOnInit(): void {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['Officer' as Role, Validators.required],
      branch: ['', Validators.required],
      status: ['Active' as Status, Validators.required],
    });
  }
 
  /** OPTIONAL: smoother DOM updates */
  trackByUserId = (_: number, u: User) => u.userId;
 
  /** Row click/select button can call this */
  onSelect(u: User): void {
    this.selectUser.emit(u);
  }
 
  startEdit(u: User): void {
    this.editingUserId = u.userId;
    this.editForm.setValue({
      name: u.name,
      email: u.email,
      role: u.role,
      branch: u.branch,
      status: u.status
    });
  }
 
 
  cancelEdit(): void {
    this.editingUserId = undefined;
    this.editForm.reset();
  }
 
  saveEdit(original: User): void {
    if (this.editForm.invalid) return;
 
    // Optional: trim strings to keep data clean
    const v = this.editForm.value;
    const updated: User = {
      ...original,
      name: (v.name ?? '').trim(),
      email: (v.email ?? '').trim(),
      role: v.role as Role,
      branch: (v.branch ?? '').trim(),
      status: v.status as Status
    };
 
    // Emit to parent; parent will move to pending list if status === 'Pending'
    this.updateUser.emit(updated);
 
    this.cancelEdit();
  }
 
  /** Get filtered rows based on search term */
  getFilteredRows(): User[] {
    if (!this.searchTerm.trim()) {
      return this.rows;
    }
    const term = this.searchTerm.toLowerCase();
    return this.rows.filter(u =>
      u.userId.toLowerCase().includes(term) ||
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term) ||
      u.branch.toLowerCase().includes(term) ||
      u.status.toLowerCase().includes(term)
    );
  }
 
  /** Clear search */
  clearSearch(): void {
    this.searchTerm = '';
  }
}
 
 