/**
 * Tevékenységnapló formázó segédfüggvények.
 */

interface ActivityItem {
  subjectName: string | null;
  event: string | null;
  causer: { name: string } | null;
  createdAt: string;
}

export interface SubjectGroup {
  subjectName: string;
  count: number;
  events: Record<string, number>;
  causers: string[];
  lastAt: string;
  firstAt: string;
}

/**
 * Aktivitásokat tárgy (subjectName) szerint csoportosítja.
 * Eredmény: darabszám, eseménytípus eloszlás, érintett felhasználók, időszak.
 */
export function groupBySubject(items: ActivityItem[]): SubjectGroup[] {
  const map = new Map<string, SubjectGroup>();

  for (const item of items) {
    const key = item.subjectName || '(ismeretlen)';
    let group = map.get(key);
    if (!group) {
      group = {
        subjectName: key,
        count: 0,
        events: {},
        causers: [],
        lastAt: item.createdAt,
        firstAt: item.createdAt,
      };
      map.set(key, group);
    }
    group.count++;
    const ev = item.event || 'egyéb';
    group.events[ev] = (group.events[ev] || 0) + 1;
    if (item.causer?.name && !group.causers.includes(item.causer.name)) {
      group.causers.push(item.causer.name);
    }
    if (item.createdAt > group.lastAt) group.lastAt = item.createdAt;
    if (item.createdAt < group.firstAt) group.firstAt = item.createdAt;
  }

  return Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

export function formatEventSummary(events: Record<string, number>): string {
  const labels: Record<string, string> = {
    created: 'létrehozás',
    updated: 'módosítás',
    deleted: 'törlés',
  };
  return Object.entries(events)
    .map(([ev, count]) => `${count} ${labels[ev] || ev}`)
    .join(', ');
}

export function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'épp most';
  if (diffMin < 60) return `${diffMin} perce`;
  if (diffH < 24) return `${diffH} órája`;
  if (diffD === 1) return 'tegnap';
  if (diffD < 7) return `${diffD} napja`;
  return d.toLocaleDateString('hu-HU', { month: '2-digit', day: '2-digit' });
}

export function getEventLabel(event: string | null): string {
  if (!event) return '';
  const map: Record<string, string> = {
    created: 'Létrehozva',
    updated: 'Módosítva',
    deleted: 'Törölve',
  };
  return map[event] ?? event;
}

export function getEventClass(event: string | null): string {
  const map: Record<string, string> = {
    created: 'badge-green',
    updated: 'badge-blue',
    deleted: 'badge-red',
  };
  return map[event ?? ''] ?? 'badge-gray';
}

export function formatChanges(changes: { old?: Record<string, unknown>; attributes?: Record<string, unknown>; source?: string } | null): string {
  if (!changes) return '';
  const parts: string[] = [];
  if (changes.old && changes.attributes) {
    for (const key of Object.keys(changes.attributes)) {
      const oldVal = changes.old[key] ?? '—';
      const newVal = changes.attributes[key] ?? '—';
      parts.push(`${key}: ${oldVal} → ${newVal}`);
    }
  }
  if (changes.source) {
    parts.push(`forrás: ${changes.source}`);
  }
  return parts.join(' · ');
}
