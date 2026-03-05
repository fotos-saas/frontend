import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PhotoUploadWizardComponent } from './photo-upload-wizard.component';
import { PhotoUploadWizardActionsService } from './photo-upload-wizard-actions.service';

describe('PhotoUploadWizardComponent', () => {
  let component: PhotoUploadWizardComponent;
  let fixture: ComponentFixture<PhotoUploadWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoUploadWizardComponent],
      providers: [
        { provide: PhotoUploadWizardActionsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoUploadWizardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
