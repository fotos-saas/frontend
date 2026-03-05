import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PasswordSetDialogComponent } from './password-set-dialog.component';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Router } from '@angular/router';

describe('PasswordSetDialogComponent', () => {
  let component: PasswordSetDialogComponent;
  let fixture: ComponentFixture<PasswordSetDialogComponent>;

  beforeEach(async () => {
    const mockAuthService = {};
    const mockToastService = {};

    await TestBed.configureTestingModule({
      imports: [PasswordSetDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: { navigate: vi.fn(), events: { subscribe: vi.fn() }, url: '/' } }
      ],
    })
    .overrideComponent(PasswordSetDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordSetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
