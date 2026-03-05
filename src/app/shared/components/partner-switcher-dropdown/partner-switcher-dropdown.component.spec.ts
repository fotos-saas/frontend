import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerSwitcherDropdownComponent } from './partner-switcher-dropdown.component';
import { PartnerSwitchService } from '../../../core/services/auth/partner-switch.service';

describe('PartnerSwitcherDropdownComponent', () => {
  let component: PartnerSwitcherDropdownComponent;
  let fixture: ComponentFixture<PartnerSwitcherDropdownComponent>;

  beforeEach(async () => {
    const mockPartnerSwitchService = {
      getMyPartners: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      switchPartner: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [PartnerSwitcherDropdownComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PartnerSwitchService, useValue: mockPartnerSwitchService }
      ],
    })
    .overrideComponent(PartnerSwitcherDropdownComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartnerSwitcherDropdownComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentPartnerId', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit partnerSwitched', () => {
    const spy = vi.fn();
    component.partnerSwitched.subscribe(spy);
    component.partnerSwitched.emit();
    expect(spy).toHaveBeenCalled();
  });
});
