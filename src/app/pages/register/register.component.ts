import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormGroup,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [ReactiveFormsModule, CommonModule, RouterModule]
})
export class RegisterComponent implements OnInit {
  signupForm!: FormGroup;

  message: string = '';
  messageType: 'success' | 'error' | 'warning' | null = null;
  showMessage: boolean = false;
  messageTimeout: any = null;

  showSignupPassword: boolean = false;
  showConfirmPassword: boolean = false;

  private passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;

    if (!password || !confirm) return null;

    return password === confirm ? null : { passwordMismatch: true };
  };

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.signupForm = this.fb.group(
      {
        name: ['', Validators.required],
        userId: ['', [Validators.required, Validators.minLength(4)]],
        email: ['', [Validators.required, Validators.email]],
        branch: ['', Validators.required],
        role: ['', Validators.required],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: this.passwordsMatchValidator,
        updateOn: 'change',
      }
    );

    this.signupForm.reset();
  }

  toggleSignupPassword(): void {
    this.showSignupPassword = !this.showSignupPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
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

  signup() {
    if (this.signupForm.invalid || this.signupForm.hasError('passwordMismatch')) {
      this.displayMessage('Please fix the form errors before submitting.', 'error');
      this.signupForm.get('password')?.markAsTouched();
      this.signupForm.get('confirmPassword')?.markAsTouched();
      return;
    }

    const { confirmPassword, ...payload } = this.signupForm.value;

    const serviceRole = this.normalizeRoleToService(payload.role);

    const user: User = {
      ...payload,
      role: serviceRole,
    } as User;

    try {
      this.auth.signup(user);
      console.log('All registered users:', this.auth.getAllUsers());
      this.displayMessage('Registration submitted ✅', 'success');

      setTimeout(() => {
        this.router.navigate(['/signin']);
        this.clearMessage();
      }, 2000);
    } catch (e: any) {
      const errorMsg = (typeof e?.message === 'string') ? e.message : 'Registration failed';

      let displayMsg = errorMsg;
      if (errorMsg.includes('User ID') || errorMsg.includes('userId')) {
        displayMsg = '❌ User ID already exists. Please choose a different ID.';
      } else if (errorMsg.includes('Email') || errorMsg.includes('email')) {
        displayMsg = '❌ Email already exists. Please use a different email.';
      } else if (errorMsg.includes('Name') || errorMsg.includes('name')) {
        displayMsg = '❌ Name is required.';
      } else if (errorMsg.includes('Branch') || errorMsg.includes('branch')) {
        displayMsg = '❌ Branch is required.';
      } else {
        displayMsg = `❌ Registration failed: ${errorMsg}`;
      }

      this.displayMessage(displayMsg, 'error');
      console.error('Signup error:', e);
    }
  }

  private normalizeRoleToService(role: any): 'admin' | 'bankManager' | 'bankOfficer' {
    const r = (role ?? '').toString().toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'manager' || r === 'bankmanager') return 'bankManager';
    return 'bankOfficer';
  }
}
