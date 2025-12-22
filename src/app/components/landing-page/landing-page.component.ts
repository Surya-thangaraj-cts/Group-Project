import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../auth/auth.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  imports: [ReactiveFormsModule, CommonModule]
})
export class LandingPageComponent implements OnInit {
  signinForm!: FormGroup;
  signupForm!: FormGroup;
  showSignIn: boolean = true;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.signinForm = this.fb.group({
      userId: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      userId: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      branch: ['', Validators.required],
      role: ['', Validators.required],
      status: ['active', Validators.required]
    });
  }

  toggleForm(type: 'signin' | 'signup') {
    this.showSignIn = type === 'signin';
  }

  signin() {
    if (this.signinForm.valid) {
      const { userId, email } = this.signinForm.value;
      if (this.auth.signin(userId, email)) {
        const user = this.auth.getCurrentUser();
        if (user) {
          alert(`Login successful! 🎉 Welcome ${user.role}`);
          console.log('All registered users:', this.auth.getAllUsers());
          this.redirect(user.role);
        }
      } else {
        alert('Invalid credentials or inactive user');
      }
    }
  }

  signup() {
    if (this.signupForm.valid) {
      const user: User = this.signupForm.value as User;
      this.auth.signup(user);
      console.log('All registered users:', this.auth.getAllUsers());
      alert('Registration successful! You can now sign in.');
      this.toggleForm('signin');
    }
  }

  redirect(role: string) {
    if (role === 'admin') this.router.navigate(['/admin']);
    else if (role === 'bankManager') this.router.navigate(['/manager']);
    else if (role === 'bankOfficer') this.router.navigate(['/officer']);
  }
}
