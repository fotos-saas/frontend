import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BatchAddDropdownComponent } from './batch-add-dropdown.component';
import { BatchWorkspaceService } from '../../services/batch-workspace.service';
import { ElectronService } from '@core/services/electron.service';
import { PsdStatusService } from '../../services/psd-status.service';

describe('BatchAddDropdownComponent', () => {
  let component: BatchAddDropdownComponent;
  let fixture: ComponentFixture<BatchAddDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchAddDropdownComponent],
      providers: [
        { provide: BatchWorkspaceService, useValue: {} },
        { provide: ElectronService, useValue: {} },
        { provide: PsdStatusService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchAddDropdownComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
