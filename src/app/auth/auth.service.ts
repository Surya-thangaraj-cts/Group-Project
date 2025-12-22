import { Injectable } from '@angular/core';

export interface User {
  name: string;
  userId: string;
  role: 'admin' | 'bankManager' | 'bankOfficer';
  email: string;
  branch: string;
  status: 'active' | 'inactive';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private users: User[] = [];
  private currentUser: User | null = null;

  constructor() {
    // Load registered users from localStorage if available
    const stored = localStorage.getItem('users');
    if (stored) {
      this.users = JSON.parse(stored);
    }

    // Add three dummy credentials
    this.addDummyUsers();
  }

  private addDummyUsers() {
    const dummyUsers: User[] = [
      {
        name: 'Admin User',
        userId: 'admin123',
        role: 'admin',
        email: 'admin@example.com',
        branch: 'HQ',
        status: 'active'
      },
      {
        name: 'Manager User',
        userId: 'manager123',
        role: 'bankManager',
        email: 'manager@example.com',
        branch: 'Branch A',
        status: 'active'
      },
      {
        name: 'Officer User',
        userId: 'officer123',
        role: 'bankOfficer',
        email: 'officer@example.com',
        branch: 'Branch B',
        status: 'active'
      }
    ];

    // Only add them if they’re not already present
    dummyUsers.forEach(dummy => {
      if (!this.users.find(u => u.userId === dummy.userId)) {
        this.users.push(dummy);
      }
    });
    localStorage.setItem('users', JSON.stringify(this.users));
  }

  signup(user: User) {
    this.users.push(user);
    localStorage.setItem('users', JSON.stringify(this.users));
    this.currentUser = user;
  }

  signin(userId: string, email: string): boolean {
    const found = this.users.find(u => u.userId === userId && u.email === email);
    if (found && found.status === 'active') {
      this.currentUser = found;
      return true;
    }
    return false;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getAllUsers(): User[] {
  return this.users;
}


  logout() {
    this.currentUser = null;
  }
}
