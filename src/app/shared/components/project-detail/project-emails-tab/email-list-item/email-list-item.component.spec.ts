import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EmailListItemComponent } from './email-list-item.component';

describe('EmailListItemComponent', () => {
  let component: EmailListItemComponent;
  let fixture: ComponentFixture<EmailListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailListItemComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(EmailListItemComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailListItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('email', { id: 1 } as any);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default isSelected', () => {
    expect(component.isSelected()).toBe(false);
  });

  it('should compute senderDisplay', () => {
    expect(component.senderDisplay()).toBeDefined();
  });

  it('should compute avatarLetter', () => {
    expect(component.avatarLetter()).toBeDefined();
  });

  it('should compute dateDisplay', () => {
    expect(component.dateDisplay()).toBeDefined();
  });
});
