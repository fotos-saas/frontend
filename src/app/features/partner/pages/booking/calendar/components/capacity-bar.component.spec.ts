import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CapacityBarComponent } from './capacity-bar.component';

describe('CapacityBarComponent', () => {
  let component: CapacityBarComponent;
  let fixture: ComponentFixture<CapacityBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CapacityBarComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CapacityBarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
