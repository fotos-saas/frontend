import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatConversation {
  id: number;
  title: string | null;
  context_route: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface SendChatResponse {
  success: boolean;
  message: string;
  data?: {
    conversation_id: number;
    assistant_message: {
      id: number;
      content: string;
      created_at: string;
    };
    usage: {
      messages_used: number;
      messages_limit: number;
      tokens_used: number;
      tokens_limit: number;
    };
  };
}

/**
 * Help-specifikus API response (3-mezős wrapper)
 * NEM egyezik meg a központi HelpApiResponse típussal!
 */
interface HelpApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class HelpChatService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  send(message: string, conversationId?: number, contextRoute?: string): Observable<HelpApiResponse<SendChatResponse['data']>> {
    return this.http.post<HelpApiResponse<SendChatResponse['data']>>(`${this.apiUrl}/help/chat/send`, {
      message,
      conversation_id: conversationId ?? null,
      context_route: contextRoute ?? null,
    });
  }

  getConversations(): Observable<HelpApiResponse<ChatConversation[]>> {
    return this.http.get<HelpApiResponse<ChatConversation[]>>(`${this.apiUrl}/help/chat/conversations`);
  }

  getMessages(conversationId: number): Observable<HelpApiResponse<ChatMessage[]>> {
    return this.http.get<HelpApiResponse<ChatMessage[]>>(`${this.apiUrl}/help/chat/conversations/${conversationId}/messages`);
  }

  deleteConversation(conversationId: number): Observable<HelpApiResponse<null>> {
    return this.http.delete<HelpApiResponse<null>>(`${this.apiUrl}/help/chat/conversations/${conversationId}`);
  }
}
