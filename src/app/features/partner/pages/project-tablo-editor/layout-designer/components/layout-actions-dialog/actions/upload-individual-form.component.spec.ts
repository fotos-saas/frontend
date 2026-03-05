import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UploadIndividualFormComponent } from './upload-individual-form.component';

describe('UploadIndividualFormComponent', () => {
  let component: UploadIndividualFormComponent;
  let fixture: ComponentFixture<UploadIndividualFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadIndividualFormComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadIndividualFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
