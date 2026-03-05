import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { OrderDataComponent } from './order-data.component';
import { OrderDataService } from './services/order-data.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../core/services/toast.service';

describe('OrderDataComponent', () => {
  let component: OrderDataComponent;
  let fixture: ComponentFixture<OrderDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDataComponent],
      providers: [
        { provide: OrderDataService, useValue: {} },
        { provide: LoggerService, useValue: {} },
        { provide: ToastService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDataComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
