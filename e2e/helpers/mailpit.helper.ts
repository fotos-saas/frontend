import { request, APIRequestContext } from '@playwright/test';

interface MailpitMessage {
  ID: string;
  MessageID: string;
  From: { Name: string; Address: string };
  To: Array<{ Name: string; Address: string }>;
  Subject: string;
  Created: string;
  Size: number;
  Snippet: string;
}

interface MailpitMessageDetail extends MailpitMessage {
  HTML: string;
  Text: string;
}

/**
 * Mailpit REST API wrapper.
 *
 * Mailpit elkapja az összes emailt amit a Laravel küld (SMTP :1025).
 * A REST API-n (:8025) lekérdezhetjük, hogy megérkezett-e egy email.
 *
 * Docker compose-ban: photostack-mailpit (port 8026:8025, 1026:1025)
 */
export class MailpitHelper {
  private context!: APIRequestContext;

  constructor(private baseUrl = 'http://localhost:8026') {}

  async init(): Promise<void> {
    this.context = await request.newContext({
      baseURL: this.baseUrl,
    });
  }

  async dispose(): Promise<void> {
    await this.context?.dispose();
  }

  /** Összes email törlése (teszt előtt hívandó). */
  async clearInbox(): Promise<void> {
    await this.context.delete('/api/v1/messages');
  }

  /** Összes email listázása. */
  async getMessages(): Promise<MailpitMessage[]> {
    const res = await this.context.get('/api/v1/messages');
    const data = await res.json();
    return data.messages ?? [];
  }

  /** Egy konkrét email részletei (HTML + Text). */
  async getMessage(id: string): Promise<MailpitMessageDetail> {
    const res = await this.context.get(`/api/v1/message/${id}`);
    return res.json();
  }

  /**
   * Várakozás egy emailre.
   *
   * Pollozza a Mailpit-et amíg megérkezik a keresett email.
   *
   * @param opts.to - Címzett email cím (string vagy RegExp)
   * @param opts.subject - Tárgy (string vagy RegExp)
   * @param opts.timeout - Max várakozás ms-ben (default: 15000)
   * @param opts.pollInterval - Pollozás gyakoriság ms-ben (default: 500)
   */
  async waitForEmail(opts: {
    to?: string | RegExp;
    subject?: string | RegExp;
    timeout?: number;
    pollInterval?: number;
  }): Promise<MailpitMessageDetail> {
    const timeout = opts.timeout ?? 15_000;
    const pollInterval = opts.pollInterval ?? 500;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const messages = await this.getMessages();

      const match = messages.find((msg) => {
        if (opts.to) {
          const toMatch = msg.To.some((t) =>
            opts.to instanceof RegExp
              ? opts.to.test(t.Address)
              : t.Address === opts.to
          );
          if (!toMatch) return false;
        }

        if (opts.subject) {
          const subjectMatch =
            opts.subject instanceof RegExp
              ? opts.subject.test(msg.Subject)
              : msg.Subject.includes(opts.subject);
          if (!subjectMatch) return false;
        }

        return true;
      });

      if (match) {
        return this.getMessage(match.ID);
      }

      await new Promise((r) => setTimeout(r, pollInterval));
    }

    throw new Error(
      `Mailpit: email nem érkezett meg ${timeout}ms alatt. ` +
        `Keresés: to=${opts.to}, subject=${opts.subject}`
    );
  }

  /**
   * Link kinyerése egy email HTML tartalmából.
   *
   * @param html - Email HTML tartalma
   * @param pattern - URL minta (RegExp) — pl. /\/invite\//
   */
  extractLink(html: string, pattern: RegExp): string | null {
    const hrefRegex = /href="([^"]+)"/g;
    let match;

    while ((match = hrefRegex.exec(html)) !== null) {
      const url = match[1];
      if (pattern.test(url)) {
        return url;
      }
    }

    return null;
  }

  /** Összes link kinyerése egy emailből. */
  extractAllLinks(html: string): string[] {
    const hrefRegex = /href="([^"]+)"/g;
    const links: string[] = [];
    let match;

    while ((match = hrefRegex.exec(html)) !== null) {
      links.push(match[1]);
    }

    return links;
  }

  /** Email darabszám az inboxban. */
  async getMessageCount(): Promise<number> {
    const messages = await this.getMessages();
    return messages.length;
  }
}
