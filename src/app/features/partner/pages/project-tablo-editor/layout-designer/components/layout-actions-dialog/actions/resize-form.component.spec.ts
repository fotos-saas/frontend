import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ResizeFormComponent } from './resize-form.component';

describe('ResizeFormComponent', () => {
  let component: ResizeFormComponent;
  let fixture: ComponentFixture<ResizeFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResizeFormComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ResizeFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
