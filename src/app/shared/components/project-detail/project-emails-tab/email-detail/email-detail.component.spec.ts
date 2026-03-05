import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EmailDetailComponent } from './email-detail.component';
import { DatePipe, DecimalPipe } from '@angular/common';
import { SafeHtmlPipe } from '../../../../pipes/safe-html.pipe';

describe('EmailDetailComponent', () => {
  let component: EmailDetailComponent;
  let fixture: ComponentFixture<EmailDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailDetailComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(EmailDetailComponent, {
      set: { imports: [DatePipe, DecimalPipe, SafeHtmlPipe], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailDetailComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('email', { id: 1, fromName: 'Test', fromEmail: 'test@test.com', subject: 'Test', bodyHtml: '<p>test</p>', createdAt: '2024-01-01', attachments: [], direction: 'inbound', thread: [] } as any);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit reply', () => {
    const spy = vi.fn();
    component.reply.subscribe(spy);
    component.reply.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit markReplied', () => {
    const spy = vi.fn();
    component.markReplied.subscribe(spy);
    component.markReplied.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit close', () => {
    const spy = vi.fn();
    component.close.subscribe(spy);
    component.close.emit();
    expect(spy).toHaveBeenCalled();
  });
});
