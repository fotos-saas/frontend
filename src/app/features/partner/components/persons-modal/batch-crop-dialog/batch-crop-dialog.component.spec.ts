import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BatchCropDialogComponent } from './batch-crop-dialog.component';
import { BatchCropActionsService } from './batch-crop-actions.service';

describe('BatchCropDialogComponent', () => {
  let component: BatchCropDialogComponent;
  let fixture: ComponentFixture<BatchCropDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchCropDialogComponent],
      providers: [
        { provide: BatchCropActionsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchCropDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
