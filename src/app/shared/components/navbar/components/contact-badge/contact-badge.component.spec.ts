import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ContactBadgeComponent } from './contact-badge.component';

describe('ContactBadgeComponent', () => {
  let component: ContactBadgeComponent;
  let fixture: ComponentFixture<ContactBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactBadgeComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ContactBadgeComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactBadgeComponent);
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
