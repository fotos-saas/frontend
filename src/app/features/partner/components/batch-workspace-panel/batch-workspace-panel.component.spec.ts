import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BatchWorkspacePanelComponent } from './batch-workspace-panel.component';
import { BatchWorkspaceService } from '../../services/batch-workspace.service';
import { BatchQueueService } from '../../services/batch-queue.service';
import { ElectronService } from '@core/services/electron.service';

describe('BatchWorkspacePanelComponent', () => {
  let component: BatchWorkspacePanelComponent;
  let fixture: ComponentFixture<BatchWorkspacePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchWorkspacePanelComponent],
      providers: [
        { provide: BatchWorkspaceService, useValue: {} },
        { provide: BatchQueueService, useValue: {} },
        { provide: ElectronService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchWorkspacePanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
