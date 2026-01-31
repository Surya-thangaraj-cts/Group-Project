// import { Injectable } from '@angular/core';

// export interface User {
//   name: string;
//   userId: string;
//   email: string;
//   branch: string;
//   role: string;
//   status: string;
// }

// @Injectable({ providedIn: 'root' })
// export class AuthService {
//   private users: User[] = [];
//   private currentUser: User | null = null;

//   constructor() {
//     this.loadUsers();
//     this.addDummyUsers();
//     this.loadCurrentUser();
//   }

//   private addDummyUsers() {
//     const dummyUsers: User[] = [
//       { name: 'Admin User', userId: 'admin123', email: 'admin@example.com', branch: 'HQ', role: 'admin', status: 'active' },
//       { name: 'Manager User', userId: 'manager123', email: 'manager@example.com', branch: 'Branch A', role: 'bankManager', status: 'active' },
//       { name: 'Officer User', userId: 'officer123', email: 'officer@example.com', branch: 'Branch B', role: 'bankOfficer', status: 'active' }
//     ];

//     dummyUsers.forEach(u => {
//       if (!this.users.find(x => x.userId === u.userId)) {
//         this.users.push(u);
//       }
//     });
//     this.saveUsers();
//   }

//   signup(user: User) {
//     this.users.push(user);
//     this.saveUsers();
//   }

//   signin(userId: string, email: string): boolean {
//     const found = this.users.find(u => u.userId === userId && u.email === email);
//     if (found && found.status === 'active') {
//       this.currentUser = found;
//       localStorage.setItem('currentUser', JSON.stringify(found)); // ✅ persist
//       return true;
//     }
//     return false;
//   }

//   getCurrentUser(): User | null {
//     if (this.currentUser) return this.currentUser;
//     const stored = localStorage.getItem('currentUser');
//     return stored ? JSON.parse(stored) : null;
//   }

//   logout() {
//     this.currentUser = null;
//     localStorage.removeItem('currentUser');
//   }

//   private saveUsers() {
//     localStorage.setItem('users', JSON.stringify(this.users));
//   }

//   private loadUsers() {
//     const stored = localStorage.getItem('users');
//     this.users = stored ? JSON.parse(stored) : [];
//   }

//   private loadCurrentUser() {
//     const stored = localStorage.getItem('currentUser');
//     this.currentUser = stored ? JSON.parse(stored) : null;
//   }

//   getAllUsers(): User[] {
//     return this.users;
//   }
// }