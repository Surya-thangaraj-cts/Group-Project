import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExistingUsersTableComponent } from './existing-users-table.component';

describe('ExistingUsersTableComponent', () => {
  let component: ExistingUsersTableComponent;
  let fixture: ComponentFixture<ExistingUsersTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExistingUsersTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExistingUsersTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
