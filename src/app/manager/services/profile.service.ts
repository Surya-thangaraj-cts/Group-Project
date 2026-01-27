import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface ManagerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  branch: string;
  department: string;
  joinDate: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  employeeId: string;
  reportingTo: string;
  role: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private profileSubject = new BehaviorSubject<ManagerProfile>(this.getDefaultProfile());
  public profile$ = this.profileSubject.asObservable();

  constructor() {}

  private getDefaultProfile(): ManagerProfile {
    return {
      id: 'MGR001',
      firstName: 'Sarah',
      lastName: 'Mitchell',
      email: 'sarah.mitchell@company.com',
      phone: '+1 (555) 123-4567',
      designation: 'Senior Operations Manager',
      branch: 'New York',
      department: 'Operations',
      joinDate: '2020-03-15',
      address: '123 Business Street, Suite 500',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      employeeId: 'EMP-2020-1234',
      reportingTo: 'David Thompson',
      role: 'Manager',
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
}
