import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GuestBadgeComponent } from './guest-badge.component';

describe('GuestBadgeComponent', () => {
  let component: GuestBadgeComponent;
  let fixture: ComponentFixture<GuestBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestBadgeComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(GuestBadgeComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
