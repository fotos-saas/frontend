import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PrintShopDashboardComponent } from './print-shop-dashboard.component';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

describe('PrintShopDashboardComponent', () => {
  let component: PrintShopDashboardComponent;
  let fixture: ComponentFixture<PrintShopDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintShopDashboardComponent],
      providers: [
        { provide: HttpClient, useValue: { get: vi.fn().mockReturnValue(of({ data: { partner_name: 'Test', stats: { pending_orders: 0, active_projects: 0, completed_this_month: 0 } } })) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PrintShopDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
