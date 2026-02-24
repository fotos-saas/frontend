import { Component, ChangeDetectionStrategy, input, OnInit, inject, viewChild } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../constants/icons.constants';
import { ProjectEmailsState } from './project-emails-state';
import { ProjectEmailsActionsService } from './project-emails-actions.service';
import { EmailListItemComponent } from './email-list-item/email-list-item.component';
import { EmailDetailComponent } from './email-detail/email-detail.component';
import { EmailReplyComponent } from './email-reply/email-reply.component';
import { ProjectEmail, EmailFilter, ReplyData } from '../../../../features/partner/models/project-email.models';

/**
 * Projekt E-mailek tab - Smart komponens.
 * IMAP-ból szinkronizált emailek listázása, megtekintése, válasz küldése.
 */
@Component({
  selector: 'app-project-emails-tab',
  standalone: true,
  imports: [
    LucideAngularModule,
    EmailListItemComponent,
    EmailDetailComponent,
    EmailReplyComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProjectEmailsActionsService],
  templateUrl: './project-emails-tab.component.html',
  styleUrl: './project-emails-tab.component.scss',
})
export class ProjectEmailsTabComponent implements OnInit {
  readonly projectId = input.required<number>();

  private readonly actions = inject(ProjectEmailsActionsService);
  readonly state = new ProjectEmailsState();
  readonly ICONS = ICONS;

  private emailDetailRef = viewChild(EmailDetailComponent);

  readonly filters: { id: EmailFilter; label: string }[] = [
    { id: 'all', label: 'Összes' },
    { id: 'inbound', label: 'Bejövő' },
    { id: 'outbound', label: 'Kimenő' },
    { id: 'needs_reply', label: 'Válaszra vár' },
  ];

  ngOnInit(): void {
    this.actions.init(this.state, this.projectId());
    this.actions.loadEmails(this.state, this.projectId());
    this.actions.loadStats(this.state, this.projectId());
  }

  onFilterChange(filter: EmailFilter): void {
    this.state.setFilter(filter);
    this.actions.loadEmails(this.state, this.projectId());
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.actions.onSearch(value);
  }

  onSelectEmail(email: ProjectEmail): void {
    this.actions.selectEmail(this.state, this.projectId(), email);
  }

  onReply(): void {
    this.state.showReply.set(true);
  }

  onSendReply(data: ReplyData): void {
    const email = this.state.selectedEmail();
    if (!email) return;
    this.actions.sendReply(this.state, this.projectId(), email.id, data);
  }

  onMarkReplied(): void {
    const email = this.state.selectedEmail();
    if (!email) return;
    this.actions.markReplied(this.state, this.projectId(), email.id);
  }

  onCancelReply(): void {
    this.state.showReply.set(false);
  }

  onCloseDetail(): void {
    this.state.closeDetail();
  }

  onPageChange(page: number): void {
    this.actions.goToPage(this.state, this.projectId(), page);
  }

  onDownloadAttachment(attachmentIndex: number): void {
    const email = this.state.selectedEmail();
    if (!email) return;

    const att = email.attachments[attachmentIndex];
    const filename = att?.filename || att?.name || 'csatolmány';

    this.actions.downloadAttachment(
      this.state,
      this.projectId(),
      email.id,
      attachmentIndex,
      filename,
      this.emailDetailRef(),
    );
  }

  onSync(): void {
    this.actions.triggerSync(this.state, this.projectId());
  }
}
