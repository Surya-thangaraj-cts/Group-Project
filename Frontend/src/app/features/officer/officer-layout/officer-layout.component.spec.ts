import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OfficerLayoutComponent } from './officer-layout.component';
import { RouterTestingModule } from '@angular/router/testing';
import { OfficerService } from '../officer.service';
import { AuthService } from '../../../auth/auth.service';
import { of } from 'rxjs';

// Mock OfficerService
class MockOfficerService {
  alert$ = of(null);
  notifications$ = of([]);
  clearAlert = jasmine.createSpy('clearAlert');
}

// Mock AuthService
class MockAuthService {
  currentUser = { name: 'Test User', role: 'officer' };
  signout = jasmine.createSpy('signout');
}

describe('OfficerLayoutComponent', () => {
  let component: OfficerLayoutComponent;
  let fixture: ComponentFixture<OfficerLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, OfficerLayoutComponent],
      providers: [
        { provide: OfficerService, useClass: MockOfficerService },
        { provide: AuthService, useClass: MockAuthService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OfficerLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Test: Component should be created
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test: Should show user initials
  it('should show user initials', () => {
    expect(component.initials('Test User')).toBe('TU');
  });

  // Test: Should toggle profile menu
  it('should toggle profile menu', () => {
    expect(component.isProfileMenuOpen).toBeFalse();
    component.toggleProfileMenu();
    expect(component.isProfileMenuOpen).toBeTrue();
  });

  // Test: Should open and close mobile nav
  it('should toggle mobile nav', () => {
    expect(component.isMobileNavOpen).toBeFalse();
    component.toggleMobileNav();
    expect(component.isMobileNavOpen).toBeTrue();
    component.closeMobileNav();
    expect(component.isMobileNavOpen).toBeFalse();
  });

  // Test: Should handle logout
  it('should call signout on logout', () => {
    const event = { stopPropagation: () => {} } as Event;
    spyOn(event, 'stopPropagation');
    component.logout(event);
    expect(event.stopPropagation).toHaveBeenCalled();
    expect((component as any).auth.signout).toHaveBeenCalled();
    expect(component.currentUser).toBeNull();
  });
});
