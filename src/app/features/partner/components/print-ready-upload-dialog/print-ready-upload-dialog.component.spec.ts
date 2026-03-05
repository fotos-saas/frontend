import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PrintReadyUploadDialogComponent } from './print-ready-upload-dialog.component';
import { PartnerFinalizationService } from '../../services/partner-finalization.service';

describe('PrintReadyUploadDialogComponent', () => {
  let component: PrintReadyUploadDialogComponent;
  let fixture: ComponentFixture<PrintReadyUploadDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintReadyUploadDialogComponent],
      providers: [
        { provide: PartnerFinalizationService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PrintReadyUploadDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
