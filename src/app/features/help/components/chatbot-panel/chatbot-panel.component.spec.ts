import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ChatbotPanelComponent } from './chatbot-panel.component';
import { HelpChatService } from '../../services/help-chat.service';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ClipboardService } from '@core/services/clipboard.service';
import { of } from 'rxjs';

describe('ChatbotPanelComponent', () => {
  let component: ChatbotPanelComponent;
  let fixture: ComponentFixture<ChatbotPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatbotPanelComponent],
      providers: [
        { provide: HelpChatService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: AuthService, useValue: { project$: of(null), isSuperAdmin: () => false, isGuest: () => false, hasFullAccess: () => false } },
        { provide: ClipboardService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatbotPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
