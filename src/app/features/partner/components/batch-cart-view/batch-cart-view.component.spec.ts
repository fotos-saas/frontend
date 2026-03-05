import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BatchCartViewComponent } from './batch-cart-view.component';
import { BatchWorkspaceService } from '../../services/batch-workspace.service';
import { BatchQueueService } from '../../services/batch-queue.service';

describe('BatchCartViewComponent', () => {
  let component: BatchCartViewComponent;
  let fixture: ComponentFixture<BatchCartViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchCartViewComponent],
      providers: [
        { provide: BatchWorkspaceService, useValue: {} },
        { provide: BatchQueueService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchCartViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
