import { Pipe, PipeTransform } from '@angular/core';
import { formatTimeAgo } from '../utils/time-formatter.util';

/**
 * Time Ago Pipe
 *
 * Relatív idő formázás magyar nyelven.
 * Delegál a közös `formatTimeAgo()` util-ra (single source of truth).
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
    return formatTimeAgo(value);
  }
}
