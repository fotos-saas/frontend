import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReplyToggleButtonComponent } from './reply-toggle-button.component';

describe('ReplyToggleButtonComponent', () => {
  let component: ReplyToggleButtonComponent;
  let fixture: ComponentFixture<ReplyToggleButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReplyToggleButtonComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ReplyToggleButtonComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReplyToggleButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('count', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default expanded', () => {
    expect(component.expanded()).toBe(false);
  });

  it('should emit clicked', () => {
    const spy = vi.fn();
    component.clicked.subscribe(spy);
    component.clicked.emit();
    expect(spy).toHaveBeenCalled();
  });
});
