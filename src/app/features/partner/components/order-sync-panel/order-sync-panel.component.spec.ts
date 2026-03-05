import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { OrderSyncPanelComponent } from './order-sync-panel.component';
import { PartnerOrderSyncService } from '../../services/partner-order-sync.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';

describe('OrderSyncPanelComponent', () => {
  let component: OrderSyncPanelComponent;
  let fixture: ComponentFixture<OrderSyncPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderSyncPanelComponent],
      providers: [
        { provide: PartnerOrderSyncService, useValue: {} },
        { provide: ToastService, useValue: {} },
        { provide: LoggerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderSyncPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
