import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GuestSessionEditDialogComponent } from './guest-session-edit-dialog.component';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';

describe('GuestSessionEditDialogComponent', () => {
  let component: GuestSessionEditDialogComponent;
  let fixture: ComponentFixture<GuestSessionEditDialogComponent>;

  beforeEach(async () => {
    const mockPartnerService = {
      updateGuestSession: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockToastService = {
      success: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      error: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [GuestSessionEditDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PartnerService, useValue: mockPartnerService },
        { provide: ToastService, useValue: mockToastService }
      ],
    })
    .overrideComponent(GuestSessionEditDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestSessionEditDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projectId', 0);
    fixture.componentRef.setInput('session', { id: 1, guestName: 'Test', guestEmail: 'test@test.com' } as any);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close', () => {
    const spy = vi.fn();
    component.close.subscribe(spy);
    component.close.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit saved', () => {
    const spy = vi.fn();
    component.saved.subscribe(spy);
    component.saved.emit();
    expect(spy).toHaveBeenCalled();
  });
});
