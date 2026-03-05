import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DeadlineCountdownComponent } from './deadline-countdown.component';

describe('DeadlineCountdownComponent', () => {
  let component: DeadlineCountdownComponent;
  let fixture: ComponentFixture<DeadlineCountdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeadlineCountdownComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DeadlineCountdownComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
