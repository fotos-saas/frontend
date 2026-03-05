import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CheckoutDialogComponent } from './checkout-dialog.component';
import { ClientWebshopService } from '../../client-webshop.service';

describe('CheckoutDialogComponent', () => {
  let component: CheckoutDialogComponent;
  let fixture: ComponentFixture<CheckoutDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutDialogComponent],
      providers: [
        { provide: ClientWebshopService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
