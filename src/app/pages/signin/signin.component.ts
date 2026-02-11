import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../auth/auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css'],
  imports: [ReactiveFormsModule, CommonModule, RouterModule]
})
export class SigninComponent implements OnInit {
  signinForm!: FormGroup;

  message: string = '';
  messageType: 'success' | 'error' | 'warning' | null = null;
  showMessage: boolean = false;
  messageTimeout: any = null;

  showPassword: boolean = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.signinForm = this.fb.group({
      userId: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.signinForm.reset();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  private displayMessage(msg: string, type: 'success' | 'error' | 'warning'): void {
    this.message = msg;
    this.messageType = type;
    this.showMessage = true;

    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }

    this.messageTimeout = setTimeout(() => {
      this.clearMessage();
    }, 5000);
  }

  clearMessage(): void {
    this.showMessage = false;
    this.message = '';
    this.messageType = null;
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
  }

  signin() {
    if (this.signinForm.invalid) return;

    const { userId, password } = this.signinForm.value;
    
    // Call API login endpoint
    this.auth.login({ userId, password }).subscribe({
      next: (response) => {
        const user = response.user;
        const norm = this.normalizeRole(user.role);
        this.displayMessage(`Login successful! 🎉 Welcome ${norm}`, 'success');
        this.signinForm.reset();
        this.redirect(norm);
      },
      error: (error) => {
        const errorMsg = error.message || 'Login failed';
        
        if (errorMsg.includes('Cannot connect to API')) {
          this.displayMessage('❌ Cannot connect to server. Please ensure the API is running.', 'error');
        } else if (errorMsg.toLowerCase().includes('not approved') || errorMsg.toLowerCase().includes('pending')) {
          this.displayMessage('Your account is awaiting admin approval.', 'warning');
        } else if (errorMsg.toLowerCase().includes('inactive')) {
          this.displayMessage('Your account is inactive. Please contact the admin for assistance.', 'error');
        } else if (errorMsg.toLowerCase().includes('credentials') || error.status === 401) {
          this.displayMessage('Invalid credentials.', 'error');
        } else {
          this.displayMessage(errorMsg, 'error');
        }
        
        console.error('Login error:', error);
      }
    });
  }

  private normalizeRole(role: any): string {
    const r = (role ?? '').toString().toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'bankmanager' || r === 'manager') return 'bankManager';
    if (r === 'bankofficer' || r === 'officer') return 'bankOfficer';
    return 'bankOfficer';
  }

  private redirect(role: string) {
    const r = role.toLowerCase();
    if (r === 'admin') this.router.navigate(['/admin']);
    else if (r === 'bankmanager' || r === 'manager') this.router.navigate(['/manager']);
    else if (r === 'bankofficer' || r === 'officer') this.router.navigate(['/officer']);
    else this.router.navigate(['/officer']);
  }
}
