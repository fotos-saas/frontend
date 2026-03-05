import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { InviteBannerComponent } from './invite-banner.component';
import { PartnerSwitchService } from '@core/services/auth/partner-switch.service';

describe('InviteBannerComponent', () => {
  let component: InviteBannerComponent;
  let fixture: ComponentFixture<InviteBannerComponent>;

  beforeEach(async () => {
    const mockPartnerSwitchService = {
      getPendingInvitations: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      acceptInvitation: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [InviteBannerComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PartnerSwitchService, useValue: mockPartnerSwitchService }
      ],
    })
    .overrideComponent(InviteBannerComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(InviteBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
