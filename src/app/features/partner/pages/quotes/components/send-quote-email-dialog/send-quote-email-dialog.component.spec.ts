import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SendQuoteEmailDialogComponent } from './send-quote-email-dialog.component';
import { PartnerQuoteService } from '../../../../services/partner-quote.service';

describe('SendQuoteEmailDialogComponent', () => {
  let component: SendQuoteEmailDialogComponent;
  let fixture: ComponentFixture<SendQuoteEmailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendQuoteEmailDialogComponent],
      providers: [
        { provide: PartnerQuoteService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SendQuoteEmailDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
