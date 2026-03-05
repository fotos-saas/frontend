import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ForumListComponent } from './forum-list.component';
import { LoggerService } from '../../../core/services/logger.service';
import { Router } from '@angular/router';
import { ForumService } from '../../../core/services/forum.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';
import { of } from 'rxjs';

describe('ForumListComponent', () => {
  let component: ForumListComponent;
  let fixture: ComponentFixture<ForumListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForumListComponent],
      providers: [
        { provide: LoggerService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: ForumService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: GuestService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ForumListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
