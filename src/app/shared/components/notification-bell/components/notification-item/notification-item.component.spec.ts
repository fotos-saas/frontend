import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NotificationItemComponent } from './notification-item.component';

describe('NotificationItemComponent', () => {
  let component: NotificationItemComponent;
  let fixture: ComponentFixture<NotificationItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationItemComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(NotificationItemComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('notification', { id: 1 } as any);
    fixture.componentRef.setInput('formattedTime', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
