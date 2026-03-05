import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { InvoiceSettingsComponent } from './invoice-settings.component';
import { InvoiceSettingsService } from '../../../../../services/invoice-settings.service';
import { ToastService } from '../../../../../../../core/services/toast.service';

describe('InvoiceSettingsComponent', () => {
  let component: InvoiceSettingsComponent;
  let fixture: ComponentFixture<InvoiceSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceSettingsComponent],
      providers: [
        { provide: InvoiceSettingsService, useValue: {} },
        { provide: ToastService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
