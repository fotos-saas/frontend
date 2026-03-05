import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EmailReplyComponent } from './email-reply.component';

describe('EmailReplyComponent', () => {
  let component: EmailReplyComponent;
  let fixture: ComponentFixture<EmailReplyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailReplyComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(EmailReplyComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailReplyComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('email', { id: 1 } as any);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default sending', () => {
    expect(component.sending()).toBe(false);
  });

  it('should emit cancel', () => {
    const spy = vi.fn();
    component.cancel.subscribe(spy);
    component.cancel.emit();
    expect(spy).toHaveBeenCalled();
  });
});
