/**
 * Tevékenységnapló formázó segédfüggvények.
 */

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
