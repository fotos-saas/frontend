import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SharedQrCodeModalComponent } from './qr-code-modal.component';
import { ClipboardService } from '../../../core/services/clipboard.service';

describe('SharedQrCodeModalComponent', () => {
  let component: SharedQrCodeModalComponent;
  let fixture: ComponentFixture<SharedQrCodeModalComponent>;

  beforeEach(async () => {
    const mockClipboardService = {
      copy: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      copyLink: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [SharedQrCodeModalComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ClipboardService, useValue: mockClipboardService }
      ],
    })
    .overrideComponent(SharedQrCodeModalComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharedQrCodeModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projectId', 0);
    fixture.componentRef.setInput('qrService', {
      getProjectQrCodes: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      generateQrCode: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      deactivateQrCode: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
    } as any);
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
});
