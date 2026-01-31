import { Injectable } from '@angular/core';
 
export interface User {
  name: string;
  userId?: string;
  email?: string;
  branch?: string;
  role: 'admin' | 'bankManager' | 'bankOfficer' | string;
  status?: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  avatarUrl?: string;
  password: string;
}
 
@Injectable({ providedIn: 'root' })
export class AuthService {
  private users: User[] = [];
  public currentUser: User | null = null;
 
  constructor() {
    this.loadUsers();
    this.addDummyUsers();
    this.loadCurrentUser();
  }
 
  /** Seed initial demo users */
  private addDummyUsers() {
    const dummyUsers: User[] = [
      {
        name: 'Admin User',
        userId: 'admin123',
        email: 'admin@example.com',
        branch: 'HQ',
        role: 'admin',
        status: 'active',
        password: 'Admin@123',
      },
      {
        name: 'Manager User',
        userId: 'manager123',
        email: 'manager@example.com',
        branch: 'Branch A',
        role: 'bankManager',
        status: 'active',
        password: 'Manager@123',
      },
      {
        name: 'Officer User',
        userId: 'officer123',
        email: 'officer@example.com',
        branch: 'Branch B',
        role: 'bankOfficer',
        status: 'active',
        password: 'Officer@123',
      },
      {
        name: 'Vikram Singh',
        userId: 'U2001',
        email: 'vikram@bank.local',
        branch: 'Bangalore',
        role: 'bankOfficer',
        status: 'pending',
        password: 'Officer@123',
      },
      {
        name: 'Sneha Kapoor',
        userId: 'U2002',
        email: 'sneha@bank.local',
        branch: 'Pune',
        role: 'bankManager',
        status: 'pending',
        password: 'Manager@123',
      },
      {
        name: 'Arjun Kumar',
        userId: 'U2003',
        email: 'arjun@bank.local',
        branch: 'Chennai',
        role: 'bankOfficer',
        status: 'pending',
        password: 'Officer@123',
      },
      {
        name: 'Divya Reddy',
        userId: 'U2004',
        email: 'divya@bank.local',
        branch: 'Hyderabad',
        role: 'admin',
        status: 'pending',
        password: 'Admin@123',
      },
      {
        name: 'Rohan Verma',
        userId: 'U2005',
        email: 'rohan@bank.local',
        branch: 'Kolkata',
        role: 'bankOfficer',
        status: 'pending',
        password: 'Officer@123',
      },
    ];

    dummyUsers.forEach(u => {
      const exists = this.users.find(x => x.userId === u.userId);
      if (!exists) this.users.push(u);
      else if (!exists.password) exists.password = u.password;
    });

    this.saveUsers();
  }  signup(user: User) {
  if (!user.userId || !user.password) {
    throw new Error('userId and password required');
  }
 
  const userId = user.userId.trim();
  const email  = (user.email ?? '').trim();
 
  // CASE-INSENSITIVE duplicate checks
  const idExists = this.users.some(
    u => (u.userId ?? '').trim().toLowerCase() === userId.toLowerCase()
  );
  if (idExists) throw new Error('User ID already exists');
 
  if (email) {
    const emailExists = this.users.some(
      u => (u.email ?? '').trim().toLowerCase() === email.toLowerCase()
    );
    if (emailExists) throw new Error('Email already in use');
  }
 
  // Force all new signups to pending
  user.status = 'pending';
 
  // Normalize before persisting
  const normalized: User = { ...user, userId, email };
  this.users.push(normalized);
  this.saveUsers();
}
 
  /** ✅ Sign in with status check */
  signin(
    userId: string,
    password: string
  ): { ok: true; user: User } | { ok: false; reason: 'invalid' | 'pending' | 'inactive' } {
 
    const found = this.users.find(u => u.userId === userId);
    if (!found) return { ok: false, reason: 'invalid' };
    if (found.status === 'pending') return { ok: false, reason: 'pending' };
    if (found.status !== 'active') return { ok: false, reason: 'inactive' };
    if (!found.password || found.password !== password) {
      return { ok: false, reason: 'invalid' };
    }
 
    found.lastLogin = new Date().toISOString();
    this.currentUser = found;
    localStorage.setItem('currentUser', JSON.stringify(found));
    return { ok: true, user: found };
  }
 
  signout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }
 
  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  }
 
  getAllUsers(): User[] {
    return [...this.users];
  }
 
  // ✅ Admin helpers
  getPendingUsers(): User[] {
    return this.users.filter(u => u.status === 'pending' );
  }
 
  approveUser(userId: string) {
    const user = this.users.find(u => u.userId === userId);
    if (!user) return;
    user.status = 'active';
    this.saveUsers();
  }
 
  rejectUser(userId: string) {
    const user = this.users.find(u => u.userId === userId);
    if (!user) return;
    user.status = 'inactive';
    this.saveUsers();
   
    // If the current user is being set to inactive, log them out
    if (this.currentUser?.userId === userId) {
      this.signout();
    }
  }
 
  /** Update user status and handle logout if needed */
  updateUserStatus(userId: string, newStatus: 'active' | 'inactive' | 'pending'): void {
    const user = this.users.find(u => u.userId === userId);
    if (!user) return;
    user.status = newStatus;
    this.saveUsers();
   
    // If the current user is being set to inactive, log them out
    if (this.currentUser?.userId === userId && newStatus === 'inactive') {
      this.signout();
    }
  }
 
  private saveUsers() {
    localStorage.setItem('users', JSON.stringify(this.users));
  }
 
  // private loadUsers() {
  //   const stored = localStorage.getItem('users');
  //   this.users = stored ? JSON.parse(stored) : [];
  // }
  private loadUsers() {
  const stored = localStorage.getItem('users');
  const arr: User[] = stored ? JSON.parse(stored) : [];
 
  // De‑duplicate by userId (trimmed, lowercased); newest wins
  const map = new Map<string, User>();
  for (const u of arr) {
    const key = (u.userId ?? '').trim().toLowerCase();
    if (!key) continue;
    map.set(key, { ...map.get(key), ...u });
  }
  this.users = Array.from(map.values());
}
 
 
  private loadCurrentUser() {
    const stored = localStorage.getItem('currentUser');
    this.currentUser = stored ? JSON.parse(stored) : null;
  }
}