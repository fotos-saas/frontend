import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TimeColumnComponent } from './time-column.component';

describe('TimeColumnComponent', () => {
  let component: TimeColumnComponent;
  let fixture: ComponentFixture<TimeColumnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeColumnComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeColumnComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
