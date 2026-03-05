import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StepUploadComponent } from './step-upload.component';

describe('StepUploadComponent', () => {
  let component: StepUploadComponent;
  let fixture: ComponentFixture<StepUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepUploadComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(StepUploadComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
