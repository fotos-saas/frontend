import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
  state,
} from '@angular/animations';

export const slotEnterAnimation = trigger('slotEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.9)' }),
    animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
  ]),
]);

export const heatmapFillAnimation = trigger('heatmapFill', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.8)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
  ]),
]);

export const viewSwitchAnimation = trigger('viewSwitch', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('250ms ease-out', style({ opacity: 1 })),
  ]),
  transition(':leave', [
    animate('150ms ease-in', style({ opacity: 0 })),
  ]),
]);

export const slidePanelAnimation = trigger('slidePanel', [
  transition(':enter', [
    style({ transform: 'translateX(100%)', opacity: 0 }),
    animate(
      '300ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ transform: 'translateX(0)', opacity: 1 }),
    ),
  ]),
  transition(':leave', [
    animate(
      '200ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ transform: 'translateX(100%)', opacity: 0 }),
    ),
  ]),
]);

export const conflictShakeAnimation = trigger('conflictShake', [
  state('conflict', style({ borderColor: '#ef4444' })),
  transition('* => conflict', [
    animate('100ms', style({ transform: 'translateX(-5px)' })),
    animate('100ms', style({ transform: 'translateX(5px)' })),
    animate('100ms', style({ transform: 'translateX(-3px)' })),
    animate('100ms', style({ transform: 'translateX(3px)' })),
    animate('100ms', style({ transform: 'translateX(0)' })),
  ]),
]);

export const staggerListAnimation = trigger('staggerList', [
  transition(':enter', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
      stagger('50ms', [
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);
