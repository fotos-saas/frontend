import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-chatbot-message',
  standalone: true,
  imports: [NgClass, SafeHtmlPipe],
  templateUrl: './chatbot-message.component.html',
  styleUrl: './chatbot-message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatbotMessageComponent {
  readonly role = input.required<'user' | 'assistant'>();
  readonly content = input.required<string>();
  readonly timestamp = input<string>();
}
