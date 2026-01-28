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
    // ✅ Sign In: use password
    this.signinForm = this.fb.group({
      userId: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    // ✅ Register: include password + confirm, with match validator
    this.signupForm = this.fb.group(
      {
        name: ['', Validators.required],
        userId: ['', [Validators.required, Validators.minLength(4)]],
        email: ['', [Validators.required, Validators.email]],
        branch: ['', Validators.required],
        role: ['', Validators.required],
        status: ['active', Validators.required],
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
        updateOn: 'change', // default; you can switch to 'blur' if you prefer
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

  // ✅ Sign In with password
  signin() {
    if (this.signinForm.valid) {
      const { userId, password } = this.signinForm.value;
      if (this.auth.signin(userId, password)) {
        const user = this.auth.getCurrentUser();
        if (user) {
          this.message = `Login successful! 🎉 Welcome ${user.role}`;
          console.log(`Login successful! Welcome ${user.role}`);
          this.redirect(user.role);
        }
      } else {
        this.message = 'Invalid credentials or inactive user';
        console.log('Invalid credentials or inactive user');
      }
    }
  }

  // ✅ Register: block submit if mismatch; exclude confirmPassword from payload
  signup() {
    if (this.signupForm.invalid || this.signupForm.hasError('passwordMismatch')) {
      this.message = 'Please fix the form errors before submitting.';
      // Mark relevant controls as touched to show errors
      this.signupForm.get('password')?.markAsTouched();
      this.signupForm.get('confirmPassword')?.markAsTouched();
      return;
    }

    const { confirmPassword, ...payload } = this.signupForm.value;
    const user: User = payload as User;

    this.auth.signup(user);
    console.log('All registered users:', this.auth.getAllUsers());
    this.message = 'Registration successful! You can now sign in.';
    this.toggleForm('signin');
  }

  redirect(role: string) {
    if (role === 'admin') this.router.navigate(['/admin']);
    else if (role === 'bankManager') this.router.navigate(['/manager']);
    else if (role === 'bankOfficer') this.router.navigate(['/officer']);
  }
}
