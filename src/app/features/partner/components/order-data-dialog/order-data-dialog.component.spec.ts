import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { OrderDataDialogComponent } from './order-data-dialog.component';
import { PartnerService } from '../../services/partner.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { ToastService } from '../../../../core/services/toast.service';

describe('OrderDataDialogComponent', () => {
  let component: OrderDataDialogComponent;
  let fixture: ComponentFixture<OrderDataDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDataDialogComponent],
      providers: [
        { provide: PartnerService, useValue: {} },
        { provide: LoggerService, useValue: {} },
        { provide: ToastService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDataDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
