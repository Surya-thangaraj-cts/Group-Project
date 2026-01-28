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
import { Router } from '@angular/router';
import { AuthService, User } from '../../auth/auth.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  templateUrl: 'landing-page.component.html',
  styleUrls: ['landing-page.component.css'],
  imports: [ReactiveFormsModule, CommonModule]
})
export class LandingPageComponent implements OnInit {
  signinForm!: FormGroup;
  signupForm!: FormGroup;

  showForm: 'signin' | 'register' | null = null;

  welcomeMessages: string[] = ['Welcome', 'स्वागत है', 'வணக்கம்', 'స్వాగతం','വണക്കം'];
  currentMessage: string = this.welcomeMessages[0];
  messageIndex: number = 0;
  fade: boolean = false;

  message: string = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  // ✅ Form-level validator (typed properly)
  private passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;

    // Don't show mismatch until both fields have values
    if (!password || !confirm) return null;

    return password === confirm ? null : { passwordMismatch: true };
  };

  ngOnInit() {
    // (Optional but helpful during testing)
    // localStorage.removeItem('currentUser');

    // ✅ Sign In: userId + password
    this.signinForm = this.fb.group({
      userId: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    // ✅ Register: remove 'status' (service forces pending)
    this.signupForm = this.fb.group(
      {
        name: ['', Validators.required],
        userId: ['', [Validators.required, Validators.minLength(4)]],
        email: ['', [Validators.required, Validators.email]],
        branch: ['', Validators.required],
        role: ['', Validators.required],           // 'admin' | 'bankManager' | 'bankOfficer'
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/), // letters + numbers
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: this.passwordsMatchValidator,
        updateOn: 'change',
      }
    );

    // Rotate welcome messages
    setInterval(() => {
      this.fade = true;
      setTimeout(() => {
        this.messageIndex = (this.messageIndex + 1) % this.welcomeMessages.length;
        this.currentMessage = this.welcomeMessages[this.messageIndex];
        this.fade = false;
      }, 1000);
    }, 3000);
  }

  toggleForm(type: 'signin' | 'register') {
    this.showForm = type;
  }

  scrollTo(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }

  // ✅ Sign In with status-aware result object
  signin() {
    if (this.signinForm.invalid) return;

    const { userId, password } = this.signinForm.value;
    const result = this.auth.signin(userId, password);

    if ((result as any)?.ok) {
      const user = (result as any).user as User;
      const norm = this.normalizeRole(user.role);
      this.message = `Login successful! 🎉 Welcome ${norm}`;
      this.redirect(norm);
      return;
    }

    // Handle all blocked/error reasons
    const reason = (result as any)?.reason;
    switch (reason) {
      case 'pending':
        this.message = 'Your account is awaiting admin approval.';
        break;
      case 'inactive':
        this.message = 'Your account is inactive. Contact admin.';
        break;
      default:
        this.message = 'Invalid credentials.';
    }
  }

  // ✅ Register: do NOT send status; service forces "pending"
  signup() {
    if (this.signupForm.invalid || this.signupForm.hasError('passwordMismatch')) {
      this.message = 'Please fix the form errors before submitting.';
      this.signupForm.get('password')?.markAsTouched();
      this.signupForm.get('confirmPassword')?.markAsTouched();
      return;
    }

    const { confirmPassword, ...payload } = this.signupForm.value;

    // Make sure role is one of the service roles
    const serviceRole = this.normalizeRoleToService(payload.role);

    const user: User = {
      ...payload,
      role: serviceRole,   // 'admin' | 'bankManager' | 'bankOfficer'
      // status is intentionally not sent; AuthService sets status='pending'
    } as User;

    try {
      this.auth.signup(user);
      console.log('All registered users:', this.auth.getAllUsers());
      this.message = 'Registration submitted ✅. You can sign in after admin approval.';
      this.toggleForm('signin');
    } catch (e: any) {
      const msg = (typeof e?.message === 'string') ? e.message : 'Registration failed';
      this.message = msg;
      console.error('Signup error:', e);
    }
  }

  // ✅ Route based on normalized role
  redirect(role: string) {
    const r = role.toLowerCase();
    if (r === 'admin') this.router.navigate(['/admin']);
    else if (r === 'bankmanager' || r === 'manager') this.router.navigate(['/manager']);
    else if (r === 'bankofficer' || r === 'officer') this.router.navigate(['/officer']);
    else this.router.navigate(['/officer']); // default
  }

  /** Accepts either UI or service role & returns a readable string */
  private normalizeRole(role: any): string {
    const r = (role ?? '').toString().toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'bankmanager' || r === 'manager') return 'bankManager';
    if (r === 'bankofficer' || r === 'officer') return 'bankOfficer';
    return 'bankOfficer';
  }

  /** Converts UI roles to service roles */
  private normalizeRoleToService(role: any): 'admin' | 'bankManager' | 'bankOfficer' {
    const r = (role ?? '').toString().toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'manager' || r === 'bankmanager') return 'bankManager';
    return 'bankOfficer';
  }
}