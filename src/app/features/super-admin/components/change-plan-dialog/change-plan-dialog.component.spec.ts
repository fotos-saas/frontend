import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ChangePlanDialogComponent } from './change-plan-dialog.component';
import { LoggerService } from '@core/services/logger.service';
import { SuperAdminService } from '../../services/super-admin.service';
import { PlansService } from '../../../../shared/services/plans.service';

describe('ChangePlanDialogComponent', () => {
  let component: ChangePlanDialogComponent;
  let fixture: ComponentFixture<ChangePlanDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangePlanDialogComponent],
      providers: [
        { provide: LoggerService, useValue: {} },
        { provide: SuperAdminService, useValue: {} },
        { provide: PlansService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePlanDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
