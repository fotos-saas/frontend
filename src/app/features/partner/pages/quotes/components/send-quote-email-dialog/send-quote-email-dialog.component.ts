import { Component, ChangeDetectionStrategy, input, output, signal, inject, OnInit, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { PartnerQuoteService } from '../../../../services/partner-quote.service';
import { EmailSnippet } from '../../../../models/quote.models';

@Component({
  selector: 'app-send-quote-email-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent],
  templateUrl: './send-quote-email-dialog.component.html',
  styleUrl: './send-quote-email-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendQuoteEmailDialogComponent implements OnInit {
  private readonly quoteService = inject(PartnerQuoteService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ICONS = ICONS;

  readonly customerEmail = input<string>('');
  readonly quoteNumber = input<string>('');
  readonly send = output<{ to_email: string; subject: string; body: string }>();
  readonly close = output<void>();

  protected toEmail = signal('');
  protected subject = signal('');
  protected body = signal('');
  protected snippets = signal<EmailSnippet[]>([]);

  ngOnInit(): void {
    this.toEmail.set(this.customerEmail());
    this.subject.set(`Árajánlat - ${this.quoteNumber()}`);
    this.loadSnippets();
  }

  private loadSnippets(): void {
    this.quoteService.getEmailSnippets()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.snippets.set(res.data),
      });
  }

  applySnippet(snippet: EmailSnippet): void {
    if (snippet.subject) this.subject.set(snippet.subject);
    if (snippet.content) this.body.set(snippet.content);
  }

  onSubmit(): void {
    if (!this.toEmail() || !this.subject()) return;
    this.send.emit({
      to_email: this.toEmail(),
      subject: this.subject(),
      body: this.body(),
    });
  }
}
