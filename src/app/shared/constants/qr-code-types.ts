import { ICONS } from './icons.constants';

export type QrCodeTypeKey = 'coordinator' | 'parent' | 'student' | 'teacher' | 'management' | 'visitor';

export interface QrCodeTypeConfig {
  value: QrCodeTypeKey;
  label: string;
  icon: string;
  color: string;
  bgClass: string;
  textClass: string;
}

export const QR_CODE_TYPES: Record<QrCodeTypeKey, QrCodeTypeConfig> = {
  coordinator: {
    value: 'coordinator',
    label: 'Kapcsolattartó',
    icon: ICONS.KEY,
    color: '#6366f1',
    bgClass: 'bg-indigo-100',
    textClass: 'text-indigo-700',
  },
  parent: {
    value: 'parent',
    label: 'Szülő',
    icon: ICONS.USERS,
    color: '#8b5cf6',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-700',
  },
  student: {
    value: 'student',
    label: 'Diák',
    icon: ICONS.GRADUATION_CAP,
    color: '#10b981',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-700',
  },
  teacher: {
    value: 'teacher',
    label: 'Osztályfőnök',
    icon: ICONS.SCHOOL,
    color: '#f59e0b',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
  },
  management: {
    value: 'management',
    label: 'Igazgatóság',
    icon: ICONS.BUILDING_2,
    color: '#ef4444',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
  },
  visitor: {
    value: 'visitor',
    label: 'Látogató',
    icon: ICONS.EYE,
    color: '#6b7280',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-700',
  },
} as const;

export const QR_CODE_TYPE_LIST: QrCodeTypeConfig[] = Object.values(QR_CODE_TYPES);
