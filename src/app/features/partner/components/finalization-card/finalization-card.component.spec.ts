import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FinalizationCardComponent } from './finalization-card.component';

describe('FinalizationCardComponent', () => {
  let component: FinalizationCardComponent;
  let fixture: ComponentFixture<FinalizationCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalizationCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FinalizationCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
