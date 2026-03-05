import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { InactiveStateComponent } from './inactive-state.component';

describe('InactiveStateComponent', () => {
  let component: InactiveStateComponent;
  let fixture: ComponentFixture<InactiveStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InactiveStateComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(InactiveStateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
