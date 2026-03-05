import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HelpChatService } from './help-chat.service';

describe('HelpChatService', () => {
  let service: HelpChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HelpChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('send should POST message', () => {
    service.send('Hello', 1, '/home').subscribe();
    const req = httpMock.expectOne('/api/help/chat/send');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.message).toBe('Hello');
    expect(req.request.body.conversation_id).toBe(1);
    req.flush({ success: true, message: 'OK', data: null });
  });

  it('getConversations should GET', () => {
    service.getConversations().subscribe();
    const req = httpMock.expectOne('/api/help/chat/conversations');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: 'OK', data: [] });
  });

  it('getMessages should GET with conversationId', () => {
    service.getMessages(5).subscribe();
    const req = httpMock.expectOne('/api/help/chat/conversations/5/messages');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: 'OK', data: [] });
  });

  it('deleteConversation should DELETE', () => {
    service.deleteConversation(3).subscribe();
    const req = httpMock.expectOne('/api/help/chat/conversations/3');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK', data: null });
  });
});
