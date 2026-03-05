import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BatchPortraitDialogComponent } from './batch-portrait-dialog.component';
import { BatchPortraitActionsService } from './batch-portrait-actions.service';

describe('BatchPortraitDialogComponent', () => {
  let component: BatchPortraitDialogComponent;
  let fixture: ComponentFixture<BatchPortraitDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchPortraitDialogComponent],
      providers: [
        { provide: BatchPortraitActionsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchPortraitDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
