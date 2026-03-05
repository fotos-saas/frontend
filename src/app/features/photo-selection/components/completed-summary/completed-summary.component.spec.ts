import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CompletedSummaryComponent } from './completed-summary.component';

describe('CompletedSummaryComponent', () => {
  let component: CompletedSummaryComponent;
  let fixture: ComponentFixture<CompletedSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompletedSummaryComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CompletedSummaryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
