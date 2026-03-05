import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DailyLimitBadgeComponent } from './daily-limit-badge.component';

describe('DailyLimitBadgeComponent', () => {
  let component: DailyLimitBadgeComponent;
  let fixture: ComponentFixture<DailyLimitBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyLimitBadgeComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyLimitBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
