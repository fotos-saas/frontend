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

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class HelpChatService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  send(message: string, conversationId?: number, contextRoute?: string): Observable<ApiResponse<SendChatResponse['data']>> {
    return this.http.post<ApiResponse<SendChatResponse['data']>>(`${this.apiUrl}/help/chat/send`, {
      message,
      conversation_id: conversationId ?? null,
      context_route: contextRoute ?? null,
    });
  }

  getConversations(): Observable<ApiResponse<ChatConversation[]>> {
    return this.http.get<ApiResponse<ChatConversation[]>>(`${this.apiUrl}/help/chat/conversations`);
  }

  getMessages(conversationId: number): Observable<ApiResponse<ChatMessage[]>> {
    return this.http.get<ApiResponse<ChatMessage[]>>(`${this.apiUrl}/help/chat/conversations/${conversationId}/messages`);
  }

  deleteConversation(conversationId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/help/chat/conversations/${conversationId}`);
  }
}
