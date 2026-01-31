# Osztály Naptár - Angular Komponensek

> Verzió: 1.0
> Dátum: 2025-01-19

---

## 📁 Mappa Struktúra

```
src/app/
├── core/
│   ├── models/
│   │   └── event.models.ts          # TypeScript interfaces
│   └── services/
│       └── event.service.ts          # API + state management
│
├── shared/
│   └── components/
│       ├── icon-picker/              # Emoji választó
│       └── attendance-buttons/       # Érdekel/Megyek gombok
│
└── features/
    └── calendar/
        ├── calendar.routes.ts
        ├── event-list/               # Fő lista komponens
        ├── event-card/               # Esemény kártya
        ├── event-details-modal/      # Részletek modal
        ├── event-form-modal/         # Új/Szerk form
        └── month-divider/            # Hónap elválasztó
```

---

## 📦 Komponensek

### 1. event.models.ts

```typescript
// src/app/core/models/event.models.ts

export interface Event {
  id: number;
  icon: string;
  title: string;
  date: string;           // YYYY-MM-DD
  startTime: string;      // HH:mm
  endTime: string | null;
  location: string | null;
  locationAddress: string | null;
  description: string | null;
  createdBy: UserSummary;
  createdAt: string;
  updatedAt: string | null;
  attendance: AttendanceSummary;
  myAttendance: AttendanceStatus | null;
  myReminders: ReminderType[];
}

export interface UserSummary {
  id: number;
  name: string;
}

export interface AttendanceSummary {
  going: number;
  interested: number;
  notResponded: number;
}

export type AttendanceStatus = 'going' | 'interested';
export type ReminderType = '1_day' | '1_hour' | '30_min';

export interface EventsByMonth {
  month: string;      // "JANUÁR", "FEBRUÁR", etc.
  monthKey: string;   // "2025-01", "2025-02", etc.
  events: Event[];
}

// Form types
export interface CreateEventForm {
  icon: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  locationAddress?: string;
  description?: string;
  sendPushNow: boolean;
  addToFeed: boolean;
}

export interface UpdateEventForm extends Partial<CreateEventForm> {
  notifyAttendees: boolean;
}
```

---

### 2. event.service.ts

```typescript
// src/app/core/services/event.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { Event, EventsByMonth, AttendanceStatus, ReminderType, CreateEventForm } from '../models/event.models';

@Injectable({ providedIn: 'root' })
export class EventService {
  private http = inject(HttpClient);
  private projectService = inject(ProjectService);

  // === State ===
  private readonly _events = signal<Event[]>([]);
  private readonly _loading = signal(false);
  private readonly _selectedEvent = signal<Event | null>(null);

  // === Public Signals ===
  readonly events = this._events.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly selectedEvent = this._selectedEvent.asReadonly();

  // Grouped by month
  readonly eventsByMonth = computed<EventsByMonth[]>(() => {
    const events = this._events();
    return this.groupByMonth(events);
  });

  // Next upcoming event
  readonly nextEvent = computed<Event | null>(() => {
    const events = this._events();
    const today = new Date().toISOString().split('T')[0];
    return events.find(e => e.date >= today) || null;
  });

  // === API Methods ===

  loadEvents(): Observable<Event[]> {
    const projectId = this.projectService.currentProjectId();
    this._loading.set(true);

    return this.http.get<ApiResponse<{ events: Event[] }>>(
      `/api/v1/projects/${projectId}/events`
    ).pipe(
      map(res => res.data.events),
      tap(events => {
        this._events.set(events);
        this._loading.set(false);
      })
    );
  }

  getEvent(eventId: number): Observable<Event> {
    return this.http.get<ApiResponse<Event>>(
      `/api/v1/events/${eventId}`
    ).pipe(
      map(res => res.data),
      tap(event => this._selectedEvent.set(event))
    );
  }

  createEvent(data: CreateEventForm): Observable<Event> {
    const projectId = this.projectService.currentProjectId();

    return this.http.post<ApiResponse<Event>>(
      `/api/v1/projects/${projectId}/events`,
      data
    ).pipe(
      map(res => res.data),
      tap(event => {
        this._events.update(events => this.insertSorted(events, event));
      })
    );
  }

  updateEvent(eventId: number, data: Partial<CreateEventForm>): Observable<Event> {
    return this.http.put<ApiResponse<Event>>(
      `/api/v1/events/${eventId}`,
      data
    ).pipe(
      map(res => res.data),
      tap(event => {
        this._events.update(events =>
          events.map(e => e.id === eventId ? event : e)
        );
        this._selectedEvent.set(event);
      })
    );
  }

  deleteEvent(eventId: number, notifyAttendees = true): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `/api/v1/events/${eventId}?notifyAttendees=${notifyAttendees}`
    ).pipe(
      tap(() => {
        this._events.update(events => events.filter(e => e.id !== eventId));
        this._selectedEvent.set(null);
      })
    );
  }

  // === Attendance ===

  setAttendance(eventId: number, status: AttendanceStatus): void {
    // Optimistic update
    const previousEvents = this._events();

    this._events.update(events =>
      events.map(e => {
        if (e.id === eventId) {
          const oldStatus = e.myAttendance;
          return {
            ...e,
            myAttendance: status,
            attendance: this.updateAttendanceCount(e.attendance, oldStatus, status)
          };
        }
        return e;
      })
    );

    // API call
    this.http.post(`/api/v1/events/${eventId}/attendance`, { status }).pipe(
      catchError(err => {
        // Rollback
        this._events.set(previousEvents);
        return throwError(() => err);
      })
    ).subscribe();
  }

  removeAttendance(eventId: number): void {
    const previousEvents = this._events();

    this._events.update(events =>
      events.map(e => {
        if (e.id === eventId) {
          const oldStatus = e.myAttendance;
          return {
            ...e,
            myAttendance: null,
            attendance: this.updateAttendanceCount(e.attendance, oldStatus, null)
          };
        }
        return e;
      })
    );

    this.http.delete(`/api/v1/events/${eventId}/attendance`).pipe(
      catchError(err => {
        this._events.set(previousEvents);
        return throwError(() => err);
      })
    ).subscribe();
  }

  // === Reminders ===

  setReminder(eventId: number, type: ReminderType): Observable<void> {
    return this.http.post<ApiResponse<void>>(
      `/api/v1/events/${eventId}/reminder`,
      { type }
    ).pipe(
      tap(() => {
        this._events.update(events =>
          events.map(e => {
            if (e.id === eventId && !e.myReminders.includes(type)) {
              return { ...e, myReminders: [...e.myReminders, type] };
            }
            return e;
          })
        );
      })
    );
  }

  removeReminder(eventId: number, type: ReminderType): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `/api/v1/events/${eventId}/reminder/${type}`
    ).pipe(
      tap(() => {
        this._events.update(events =>
          events.map(e => {
            if (e.id === eventId) {
              return { ...e, myReminders: e.myReminders.filter(r => r !== type) };
            }
            return e;
          })
        );
      })
    );
  }

  // === Helpers ===

  private groupByMonth(events: Event[]): EventsByMonth[] {
    const months = new Map<string, Event[]>();
    const monthNames = [
      'JANUÁR', 'FEBRUÁR', 'MÁRCIUS', 'ÁPRILIS', 'MÁJUS', 'JÚNIUS',
      'JÚLIUS', 'AUGUSZTUS', 'SZEPTEMBER', 'OKTÓBER', 'NOVEMBER', 'DECEMBER'
    ];

    events.forEach(event => {
      const [year, month] = event.date.split('-');
      const key = `${year}-${month}`;

      if (!months.has(key)) {
        months.set(key, []);
      }
      months.get(key)!.push(event);
    });

    return Array.from(months.entries()).map(([key, events]) => {
      const monthIndex = parseInt(key.split('-')[1]) - 1;
      return {
        monthKey: key,
        month: monthNames[monthIndex],
        events
      };
    });
  }

  private insertSorted(events: Event[], newEvent: Event): Event[] {
    const result = [...events, newEvent];
    return result.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }

  private updateAttendanceCount(
    current: AttendanceSummary,
    oldStatus: AttendanceStatus | null,
    newStatus: AttendanceStatus | null
  ): AttendanceSummary {
    const result = { ...current };

    // Remove from old
    if (oldStatus === 'going') result.going--;
    if (oldStatus === 'interested') result.interested--;
    if (oldStatus === null) result.notResponded--;

    // Add to new
    if (newStatus === 'going') result.going++;
    if (newStatus === 'interested') result.interested++;
    if (newStatus === null) result.notResponded++;

    return result;
  }
}
```

---

### 3. event-list.component.ts

```typescript
// src/app/features/calendar/event-list/event-list.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '@core/services/event.service';
import { AuthService } from '@core/services/auth.service';
import { EventCardComponent } from '../event-card/event-card.component';
import { MonthDividerComponent } from '../month-divider/month-divider.component';
import { EventDetailsModalComponent } from '../event-details-modal/event-details-modal.component';
import { EventFormModalComponent } from '../event-form-modal/event-form-modal.component';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    EventCardComponent,
    MonthDividerComponent,
    EventDetailsModalComponent,
    EventFormModalComponent
  ],
  template: `
    <div class="event-list">
      <header class="event-list__header">
        <h1 class="event-list__title">📅 Osztály Naptár</h1>
      </header>

      @if (eventService.loading()) {
        <!-- Skeleton -->
        @for (i of [1,2,3]; track i) {
          <div class="skeleton-card"></div>
        }
      } @else if (eventService.eventsByMonth().length === 0) {
        <!-- Empty state -->
        <div class="empty-state">
          <span class="empty-state__icon">📅</span>
          <h2>Még nincsenek események</h2>
          <p>Amint a kapcsolattartó létrehoz egy eseményt, itt fogod látni.</p>

          @if (auth.isCoordinator()) {
            <button class="btn btn--primary" (click)="openCreateModal()">
              + Első esemény létrehozása
            </button>
          }
        </div>
      } @else {
        <!-- Event list -->
        @for (group of eventService.eventsByMonth(); track group.monthKey) {
          <app-month-divider [month]="group.month" />

          @for (event of group.events; track event.id) {
            <app-event-card
              [event]="event"
              (click)="openDetails(event)"
              (attendanceChange)="onAttendanceChange($event)"
            />
          }
        }

        <!-- Add button for coordinator -->
        @if (auth.isCoordinator()) {
          <button class="add-event-btn" (click)="openCreateModal()">
            + Új esemény
          </button>
        }
      }
    </div>

    <!-- Modals -->
    @if (showDetailsModal()) {
      <app-event-details-modal
        [event]="eventService.selectedEvent()!"
        (close)="closeDetailsModal()"
        (edit)="openEditModal()"
        (delete)="onDelete($event)"
      />
    }

    @if (showFormModal()) {
      <app-event-form-modal
        [event]="editingEvent()"
        (close)="closeFormModal()"
        (save)="onSave($event)"
      />
    }
  `,
  styleUrl: './event-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListComponent implements OnInit {
  eventService = inject(EventService);
  auth = inject(AuthService);

  showDetailsModal = signal(false);
  showFormModal = signal(false);
  editingEvent = signal<Event | null>(null);

  ngOnInit(): void {
    this.eventService.loadEvents().subscribe();
  }

  openDetails(event: Event): void {
    this.eventService.getEvent(event.id).subscribe(() => {
      this.showDetailsModal.set(true);
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
  }

  openCreateModal(): void {
    this.editingEvent.set(null);
    this.showFormModal.set(true);
  }

  openEditModal(): void {
    this.editingEvent.set(this.eventService.selectedEvent());
    this.showDetailsModal.set(false);
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingEvent.set(null);
  }

  onAttendanceChange(data: { eventId: number; status: AttendanceStatus | null }): void {
    if (data.status) {
      this.eventService.setAttendance(data.eventId, data.status);
    } else {
      this.eventService.removeAttendance(data.eventId);
    }
  }

  onSave(data: CreateEventForm): void {
    const editing = this.editingEvent();

    if (editing) {
      this.eventService.updateEvent(editing.id, data).subscribe(() => {
        this.closeFormModal();
      });
    } else {
      this.eventService.createEvent(data).subscribe(() => {
        this.closeFormModal();
      });
    }
  }

  onDelete(eventId: number): void {
    this.eventService.deleteEvent(eventId).subscribe(() => {
      this.closeDetailsModal();
    });
  }
}
```

---

### 4. event-card.component.ts

```typescript
// src/app/features/calendar/event-card/event-card.component.ts

import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event, AttendanceStatus } from '@core/models/event.models';
import { AttendanceButtonsComponent } from '@shared/components/attendance-buttons/attendance-buttons.component';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, AttendanceButtonsComponent],
  template: `
    <article
      class="event-card"
      [class.event-card--going]="event().myAttendance === 'going'"
      [class.event-card--interested]="event().myAttendance === 'interested'"
      [class.event-card--past]="isPast()"
      tabindex="0"
      role="button"
      [attr.aria-label]="event().title + ', ' + formatDate()"
    >
      <div class="event-card__icon">
        {{ event().icon }}
      </div>

      <div class="event-card__content">
        <h3 class="event-card__title">{{ event().title }}</h3>

        <div class="event-card__meta">
          <span class="event-card__date">
            📆 {{ formatDate() }} • {{ event().startTime }}
          </span>

          @if (event().location) {
            <span class="event-card__location">
              📍 {{ event().location }}
            </span>
          }
        </div>

        <div class="event-card__attendance">
          👥 {{ event().attendance.going }} megy
          @if (event().attendance.interested > 0) {
            • {{ event().attendance.interested }} érdekel
          }
        </div>

        <app-attendance-buttons
          [status]="event().myAttendance"
          (statusChange)="onAttendanceChange($event)"
        />
      </div>
    </article>
  `,
  styleUrl: './event-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventCardComponent {
  event = input.required<Event>();
  attendanceChange = output<{ eventId: number; status: AttendanceStatus | null }>();

  formatDate(): string {
    const date = new Date(this.event().date);
    const days = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    const months = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szept', 'Okt', 'Nov', 'Dec'];

    return `${months[date.getMonth()]} ${date.getDate()}. (${days[date.getDay()]})`;
  }

  isPast(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.event().date < today;
  }

  onAttendanceChange(status: AttendanceStatus | null): void {
    this.attendanceChange.emit({ eventId: this.event().id, status });
  }
}
```

---

### 5. attendance-buttons.component.ts

```typescript
// src/app/shared/components/attendance-buttons/attendance-buttons.component.ts

import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceStatus } from '@core/models/event.models';

@Component({
  selector: 'app-attendance-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="attendance-buttons" (click)="$event.stopPropagation()">
      <button
        type="button"
        class="attendance-btn"
        [class.attendance-btn--interested]="status() === 'interested'"
        (click)="toggle('interested')"
        [attr.aria-pressed]="status() === 'interested'"
      >
        @if (status() === 'interested') { ✓ } Érdekel
      </button>

      <button
        type="button"
        class="attendance-btn"
        [class.attendance-btn--going]="status() === 'going'"
        (click)="toggle('going')"
        [attr.aria-pressed]="status() === 'going'"
      >
        @if (status() === 'going') { ✓ } Megyek
      </button>
    </div>
  `,
  styleUrl: './attendance-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceButtonsComponent {
  status = input<AttendanceStatus | null>(null);
  statusChange = output<AttendanceStatus | null>();

  toggle(newStatus: AttendanceStatus): void {
    // Ha ugyanarra kattint → toggle off
    if (this.status() === newStatus) {
      this.statusChange.emit(null);
    } else {
      this.statusChange.emit(newStatus);
    }
  }
}
```

---

### 6. icon-picker.component.ts

```typescript
// src/app/shared/components/icon-picker/icon-picker.component.ts

import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface IconCategory {
  name: string;
  icons: string[];
}

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="icon-picker">
      <label class="icon-picker__label">Ikon választás</label>

      @for (category of categories; track category.name) {
        <div class="icon-picker__category">
          <span class="icon-picker__category-name">{{ category.name }}</span>
          <div class="icon-picker__grid">
            @for (icon of category.icons; track icon) {
              <button
                type="button"
                class="icon-picker__btn"
                [class.icon-picker__btn--selected]="selected() === icon"
                (click)="select(icon)"
              >
                {{ icon }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './icon-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconPickerComponent {
  selected = input<string>('📅');
  selectedChange = output<string>();

  categories: IconCategory[] = [
    {
      name: 'Iskola',
      icons: ['📸', '🎓', '📝', '✍️', '📚', '🏫', '👔', '📖', '✏️', '🎒']
    },
    {
      name: 'Események',
      icons: ['💃', '🎉', '🎭', '🎪', '🎬', '🎤', '🎊', '🎁', '🥳', '🍕']
    },
    {
      name: 'Sport & Hobbi',
      icons: ['⚽', '🏆', '🎯', '🎵', '🎹', '🎨', '✈️', '🏕️', '🚴', '🏀']
    },
    {
      name: 'Szezonális',
      icons: ['🎄', '🎃', '🌸', '☀️', '⭐', '🎈', '❄️', '🌺', '🍂', '🌻']
    }
  ];

  select(icon: string): void {
    this.selectedChange.emit(icon);
  }
}
```

---

## 🛣️ Routes

```typescript
// src/app/features/calendar/calendar.routes.ts

import { Routes } from '@angular/router';

export const CALENDAR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./event-list/event-list.component').then(m => m.EventListComponent),
    title: 'Osztály Naptár'
  }
];

// Main routes
{
  path: 'calendar',
  loadChildren: () =>
    import('./features/calendar/calendar.routes').then(m => m.CALENDAR_ROUTES)
}
```

---

## ✅ Komponens Checklist

### Core
- [ ] event.models.ts
- [ ] event.service.ts

### Features
- [ ] event-list.component
- [ ] event-card.component
- [ ] event-details-modal.component
- [ ] event-form-modal.component
- [ ] month-divider.component

### Shared
- [ ] attendance-buttons.component
- [ ] icon-picker.component

### Routes
- [ ] calendar.routes.ts
- [ ] App router integration
