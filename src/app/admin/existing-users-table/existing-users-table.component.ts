
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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
  imports: [CommonModule, ReactiveFormsModule],
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
    const updated: User = { ...original, ...this.editForm.value };
    this.updateUser.emit(updated);
    this.cancelEdit();
  }
}
