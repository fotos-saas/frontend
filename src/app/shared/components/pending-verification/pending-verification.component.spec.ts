import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PendingVerificationComponent } from './pending-verification.component';
import { GuestService } from '../../../core/services/guest.service';

describe('PendingVerificationComponent', () => {
  let component: PendingVerificationComponent;
  let fixture: ComponentFixture<PendingVerificationComponent>;

  beforeEach(async () => {
    const mockGuestService = {
      stopVerificationPolling: vi.fn().mockReturnValue(null),
      startVerificationPolling: vi.fn().mockReturnValue(null),
      checkVerificationStatus: vi.fn().mockReturnValue(null)
    };

    await TestBed.configureTestingModule({
      imports: [PendingVerificationComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: GuestService, useValue: mockGuestService }
      ],
    })
    .overrideComponent(PendingVerificationComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit refreshEvent', () => {
    const spy = vi.fn();
    component.refreshEvent.subscribe(spy);
    component.refreshEvent.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit cancelEvent', () => {
    const spy = vi.fn();
    component.cancelEvent.subscribe(spy);
    component.cancelEvent.emit();
    expect(spy).toHaveBeenCalled();
  });
});
