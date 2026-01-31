import { Pipe, PipeTransform } from '@angular/core';

/**
 * Time Ago Pipe
 *
 * Relatív idő formázás magyar nyelven.
 * Példa: "most", "5 perce", "2 órája", "3 napja", "1 hete", "2 hónapja"
 *
 * @example
 * {{ post.createdAt | timeAgo }}
 * {{ '2024-01-15T10:30:00Z' | timeAgo }}
 */
@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);

    // Érvénytelen dátum ellenőrzés
    if (isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Negatív különbség (jövőbeli dátum)
    if (diffMs < 0) {
      return this.formatFuture(Math.abs(diffMs));
    }

    return this.formatPast(diffMs);
  }

  /**
   * Múltbeli idő formázás
   */
  private formatPast(diffMs: number): string {
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) return 'most';
    if (diffMins < 60) return `${diffMins} perce`;
    if (diffHours < 24) return `${diffHours} órája`;
    if (diffDays < 7) return `${diffDays} napja`;
    if (diffWeeks < 4) return `${diffWeeks} hete`;
    if (diffMonths < 12) return `${diffMonths} hónapja`;
    return `${diffYears} éve`;
  }

  /**
   * Jövőbeli idő formázás (pl. szavazás határideje)
   */
  private formatFuture(diffMs: number): string {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} perc múlva`;
    if (diffHours < 24) return `${diffHours} óra múlva`;
    if (diffDays < 7) return `${diffDays} nap múlva`;
    return `${Math.floor(diffDays / 7)} hét múlva`;
  }
}
