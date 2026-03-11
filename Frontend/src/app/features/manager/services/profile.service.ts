// Service for managing manager profile data
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { AuthService, User } from '../../../auth/auth.service';

// Interface representing a manager's profile
export interface ManagerProfile {
  id: string;           // Unique manager ID
  firstName: string;    // First name
  lastName: string;     // Last name
  email: string;        // Email address
  phone: string;        // Phone number
  designation: string;  // Job designation
  branch: string;       // Branch name
  department: string;   // Department name
  joinDate: string;     // Date joined
  address: string;      // Address
  city: string;         // City
  state: string;        // State
  zipCode: string;      // Zip code
  employeeId: string;   // Employee ID
  reportingTo: string;  // Reporting manager
  role: string;         // Role
  status: string;       // Status
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  // Holds the current manager profile
  private profileSubject = new BehaviorSubject<ManagerProfile>(this.getDefaultProfile());
  // Observable for profile data
  public profile$ = this.profileSubject.asObservable();

  constructor(private authService: AuthService) {
    // Load profile on service initialization
    this.loadCurrentUserProfile();
  }

  // Loads the current user's profile from AuthService
  private loadCurrentUserProfile(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      const profile = this.mapUserToProfile(currentUser);
      this.profileSubject.next(profile);
    } else {
      this.profileSubject.next(this.getDefaultProfile());
    }
  }

  // Maps a User object to a ManagerProfile
  private mapUserToProfile(user: User): ManagerProfile {
    const nameParts = user.name?.split(' ') || ['Unknown'];
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

    return {
      id: user.userId || 'UNKNOWN',
      firstName: firstName,
      lastName: lastName,
      email: user.email || 'no-email@company.com',
      phone: '+1 (555) 000-0000',
      designation: this.getRoleDesignation(user.role),
      branch: user.branch || 'Corporate',
      department: this.getDepartmentByRole(user.role),
      joinDate: user.lastLogin ? new Date(user.lastLogin).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      address: '123 Business Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      employeeId: user.userId || 'EMP-0000',
      reportingTo: 'Admin',
      role: user.role || 'Manager',
      status: (user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)
    };
  }

  private getRoleDesignation(role: string): string {
    const designations: { [key: string]: string } = {
      'bankManager': 'Manager',
      'bankOfficer': 'Banking Officer',
      'admin': 'System Administrator'
    };
    return designations[role] || 'Staff Member';
  }

  private getDepartmentByRole(role: string): string {
    const departments: { [key: string]: string } = {
      'bankManager': 'Operations',
      'bankOfficer': 'Customer Relations',
      'admin': 'IT & Administration'
    };
    return departments[role] || 'General';
  }

  private getDefaultProfile(): ManagerProfile {
    return {
      id: 'MGR001',
      firstName: 'Guest',
      lastName: 'User',
      email: 'guest@company.com',
      phone: '+1 (555) 000-0000',
      designation: 'Staff Member',
      branch: 'Corporate',
      department: 'General',
      joinDate: new Date().toISOString().split('T')[0],
      address: '123 Business Street, Suite 500',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      employeeId: 'EMP-0000',
      reportingTo: 'Admin',
      role: 'Staff',
      status: 'Active'
    };
  }

  getProfile(): Observable<ManagerProfile> {
    return this.profile$;
  }

  getCurrentProfile(): ManagerProfile {
    return this.profileSubject.getValue();
  }

  updateProfile(profile: Partial<ManagerProfile>): Observable<ManagerProfile> {
    const currentProfile = this.profileSubject.getValue();
    const updatedProfile = { ...currentProfile, ...profile };
    this.profileSubject.next(updatedProfile);
    return of(updatedProfile);
  }

  getInitials(): string {
    const profile = this.profileSubject.getValue();
    return (profile.firstName.charAt(0) + profile.lastName.charAt(0)).toUpperCase();
  }

  refreshProfile(): void {
    this.loadCurrentUserProfile();
  }
}
