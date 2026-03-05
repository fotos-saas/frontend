import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../../core/services/toast.service';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;

  beforeEach(async () => {
    const mockToastService = {
      toast: vi.fn().mockReturnValue(null),
      hide: vi.fn().mockReturnValue(null)
    };

    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ToastService, useValue: mockToastService }
      ],
    })
    .overrideComponent(ToastComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
