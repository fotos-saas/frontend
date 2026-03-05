import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UserBadgeComponent } from './user-badge.component';

describe('UserBadgeComponent', () => {
  let component: UserBadgeComponent;
  let fixture: ComponentFixture<UserBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserBadgeComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(UserBadgeComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit editEvent', () => {
    const spy = vi.fn();
    component.editEvent.subscribe(spy);
    component.editEvent.emit();
    expect(spy).toHaveBeenCalled();
  });
});
