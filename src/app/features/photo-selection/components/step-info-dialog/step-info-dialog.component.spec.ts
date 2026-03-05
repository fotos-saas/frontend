import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StepInfoDialogComponent } from './step-info-dialog.component';
import { TabloStorageService } from '../../../../core/services/tablo-storage.service';

describe('StepInfoDialogComponent', () => {
  let component: StepInfoDialogComponent;
  let fixture: ComponentFixture<StepInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepInfoDialogComponent],
      providers: [
        { provide: TabloStorageService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(StepInfoDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
