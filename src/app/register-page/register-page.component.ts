import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register-page',
  standalone: true,
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css'],
  imports: [ReactiveFormsModule, CommonModule]
})
export class RegisterPageComponent implements OnInit {
  registerForm!: FormGroup;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      userId: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      branch: ['', Validators.required],
      role: ['', Validators.required],
      status: ['active', Validators.required]
    });
  }

  register() {
    if (this.registerForm.valid) {
      const user: User = this.registerForm.value as User;
      this.auth.signup(user);
      alert('Registration successful! Please sign in.');
      this.router.navigate(['/landing']);
    }
  }
}
