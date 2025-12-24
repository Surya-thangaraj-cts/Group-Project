import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
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

  // Track which form is open: 'signin', 'register', or null (hidden)
  showForm: 'signin' | 'register' | null = null;

  // Welcome message rotation
  welcomeMessages: string[] = ['Welcome', 'स्वागत है', 'வணக்கம்', 'స్వాగతం','വണക്കം'];
  currentMessage: string = this.welcomeMessages[0];
  messageIndex: number = 0;
  fade: boolean = false;

  // Feedback message for user actions
  message: string = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // Sign In form
    this.signinForm = this.fb.group({
      userId: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    // Register form
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      userId: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      branch: ['', Validators.required],
      role: ['', Validators.required],
      status: ['active', Validators.required]
    });

    // Rotate welcome messages with fade transition
    setInterval(() => {
      this.fade = true;
      setTimeout(() => {
        this.messageIndex = (this.messageIndex + 1) % this.welcomeMessages.length;
        this.currentMessage = this.welcomeMessages[this.messageIndex];
        this.fade = false;
      }, 1000);
    }, 3000);
  }

  // Toggle which form to show
  toggleForm(type: 'signin' | 'register') {
    this.showForm = type;
  }

  // Smooth scroll to About/Contact sections
  scrollTo(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }

  // Sign In logic
  signin() {
    if (this.signinForm.valid) {
      const { userId, email } = this.signinForm.value;
      if (this.auth.signin(userId, email)) {
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

  // Register logic
  signup() {
    if (this.signupForm.valid) {
      const user: User = this.signupForm.value as User;
      this.auth.signup(user);
      console.log('All registered users:', this.auth.getAllUsers());
      this.message = 'Registration successful! You can now sign in.';
      this.toggleForm('signin');
    }
  }

  // Redirect based on role
  redirect(role: string) {
    if (role === 'admin') this.router.navigate(['/admin']);
    else if (role === 'bankManager') this.router.navigate(['/manager']);
    else if (role === 'bankOfficer') this.router.navigate(['/officer']);
  }
}
