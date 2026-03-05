import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FloatingInfoComponent } from './floating-info.component';

describe('FloatingInfoComponent', () => {
  let component: FloatingInfoComponent;
  let fixture: ComponentFixture<FloatingInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingInfoComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FloatingInfoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
