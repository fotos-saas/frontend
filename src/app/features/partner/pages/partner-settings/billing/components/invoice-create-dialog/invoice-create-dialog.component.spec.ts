import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { InvoiceCreateDialogComponent } from './invoice-create-dialog.component';
import { InvoiceService } from '../../../../../services/invoice.service';
import { ToastService } from '../../../../../../../core/services/toast.service';

describe('InvoiceCreateDialogComponent', () => {
  let component: InvoiceCreateDialogComponent;
  let fixture: ComponentFixture<InvoiceCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceCreateDialogComponent],
      providers: [
        { provide: InvoiceService, useValue: {} },
        { provide: ToastService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceCreateDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
