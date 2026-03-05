import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PrintShopShellComponent } from './print-shop-shell.component';
import { AuthService } from '../../core/services/auth.service';
import { SidebarStateService } from '../../core/layout/services/sidebar-state.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('PrintShopShellComponent', () => {
  let component: PrintShopShellComponent;
  let fixture: ComponentFixture<PrintShopShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintShopShellComponent],
      providers: [
        { provide: AuthService, useValue: { getCurrentUser: () => ({ name: 'Test', roles: [], partners_count: 1 }), project$: of(null), isGuest: () => false, isSuperAdmin: () => false } },
        { provide: SidebarStateService, useValue: { collapsed: vi.fn().mockReturnValue(false), toggle: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PrintShopShellComponent, {
      set: { imports: [], template: '<div></div>' }
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintShopShellComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
