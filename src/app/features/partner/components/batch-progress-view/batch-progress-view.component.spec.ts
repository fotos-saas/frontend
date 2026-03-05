import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BatchProgressViewComponent } from './batch-progress-view.component';
import { BatchQueueService } from '../../services/batch-queue.service';

describe('BatchProgressViewComponent', () => {
  let component: BatchProgressViewComponent;
  let fixture: ComponentFixture<BatchProgressViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchProgressViewComponent],
      providers: [
        { provide: BatchQueueService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchProgressViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
