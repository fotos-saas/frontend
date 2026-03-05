import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, Component } from '@angular/core';
import { MarketerShellComponent } from './marketer-shell.component';
import { AuthService } from '../../core/services/auth.service';
import { SidebarStateService } from '../../core/layout/services/sidebar-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

describe('MarketerShellComponent', () => {
  let component: MarketerShellComponent;
  let fixture: ComponentFixture<MarketerShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketerShellComponent],
      providers: [
        { provide: AuthService, useValue: { getCurrentUser: () => ({ name: 'Test', roles: [], partners_count: 1 }), project$: of(null), isGuest: () => false, isSuperAdmin: () => false, hasFullAccess: () => false } },
        { provide: SidebarStateService, useValue: { collapsed: vi.fn().mockReturnValue(false), toggle: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(MarketerShellComponent, {
      set: { imports: [], template: '<div></div>' }
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarketerShellComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
