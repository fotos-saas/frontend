import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NotificationCardComponent } from './notification-card.component';
import { Router } from '@angular/router';
import { LoggerService } from '../../../core/services/logger.service';
import { of } from 'rxjs';

describe('NotificationCardComponent', () => {
  let component: NotificationCardComponent;
  let fixture: ComponentFixture<NotificationCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationCardComponent],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: LoggerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
