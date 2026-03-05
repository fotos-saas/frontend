import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { QuoteEmailHistoryComponent } from './quote-email-history.component';

describe('QuoteEmailHistoryComponent', () => {
  let component: QuoteEmailHistoryComponent;
  let fixture: ComponentFixture<QuoteEmailHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteEmailHistoryComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(QuoteEmailHistoryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
