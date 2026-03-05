import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LayoutActionsDialogComponent } from './layout-actions-dialog.component';
import { PhotoshopService } from '../../../../../services/photoshop.service';
import { LoggerService } from '@core/services/logger.service';

describe('LayoutActionsDialogComponent', () => {
  let component: LayoutActionsDialogComponent;
  let fixture: ComponentFixture<LayoutActionsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutActionsDialogComponent],
      providers: [
        { provide: PhotoshopService, useValue: {} },
        { provide: LoggerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutActionsDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
