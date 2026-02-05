# Frontend Tablo - Comprehensive Developer Guide

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Core Features](#core-features)
5. [Authentication & Security](#authentication--security)
6. [Key Components](#key-components)
7. [Services](#services)
8. [Styling & Design](#styling--design)
9. [Development Setup](#development-setup)
10. [Build & Deployment](#build--deployment)
11. [Performance Considerations](#performance-considerations)
12. [Testing](#testing)

---

## Project Overview

**Frontend Tablo** is a modern Angular 16 application serving as the frontend for the Tablókirály school photo book management system. It provides an intuitive interface for viewing and managing project information including:

- Project dashboard with status information
- Sample photos with lightbox viewing
- Order data management
- Missing persons tracking
- Schedule reminders for photo sessions
- Share functionality for external access

**Technology Stack:**
- **Framework**: Angular 16.2.0
- **Language**: TypeScript 5.1.3
- **Styling**: Tailwind CSS 3.4.19 + SCSS
- **State Management**: RxJS Observables + Angular Signals
- **HTTP Client**: Angular HttpClientModule with Interceptors
- **Build Tool**: Angular CLI 16.2.0
- **Package Manager**: npm

**Target Devices:**
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile and tablet devices
- iPad and tablet browsing
- Native share capabilities

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                     App Module                          │
│  (Root module with providers and component setup)       │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼────┐  ┌─────▼────┐  ┌─────▼─────┐
    │ Routes │  │Core      │  │Features   │
    │        │  │Services  │  │Components │
    └────────┘  └──────────┘  └───────────┘
        │              │              │
        │      ┌───────┼───────┐     │
        │      │       │       │     │
    ┌───▼──────▼─┐  ┌──▼──┐  ┌┴─────▼─────┐
    │Auth Guard  │  │HTTP │  │Shared      │
    │& Routes    │  │Intercept│Components │
    └────────────┘  │      │  └────────────┘
                    └──────┘
```

### Design Principles

1. **Standalone Components**: Utilizes Angular's modern standalone API where applicable
2. **Smart/Dumb Components**: Container components manage state, presentational components display data
3. **Lazy Loading**: Feature modules loaded on demand (Missing Persons module)
4. **RxJS Patterns**: Observable-based data flow with proper unsubscription
5. **Angular Signals**: Modern reactive state management for UI toggles
6. **Change Detection**: OnPush strategy for performance optimization
7. **Interceptors**: Centralized HTTP request/response handling

---

## Project Structure

```
frontend-tablo/
├── src/
│   ├── app/
│   │   ├── core/                          # Core services & guards
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts          # Route protection
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts    # Bearer token & CSRF
│   │   │   └── services/
│   │   │       ├── auth.service.ts        # Authentication (6-digit code, tokens)
│   │   │       ├── clipboard.service.ts   # Copy to clipboard with toast
│   │   │       ├── schedule-reminder.service.ts
│   │   │       └── toast.service.ts       # Notification system
│   │   │
│   │   ├── features/                      # Feature modules & pages
│   │   │   ├── home/
│   │   │   │   ├── home.component.ts      # Dashboard with schedule dialog
│   │   │   │   └── home.component.html
│   │   │   ├── samples/
│   │   │   │   ├── samples.component.ts   # Photo grid with lightbox
│   │   │   │   ├── samples.component.html
│   │   │   │   └── services/
│   │   │   │       └── samples.service.ts
│   │   │   ├── order-data/
│   │   │   │   ├── order-data.component.ts
│   │   │   │   └── services/
│   │   │   │       └── order-data.service.ts
│   │   │   └── missing-persons/
│   │   │       ├── missing-persons.component.ts  # Lazy loaded
│   │   │       ├── missing-persons.module.ts
│   │   │       └── missing-persons.component.html
│   │   │
│   │   ├── shared/                        # Reusable components
│   │   │   ├── components/
│   │   │   │   ├── navbar/                # Dynamic responsive navbar
│   │   │   │   │   ├── navbar.component.ts
│   │   │   │   │   └── navbar.component.scss
│   │   │   │   ├── footer/
│   │   │   │   ├── schedule-card/         # Project info card
│   │   │   │   ├── schedule-reminder-dialog/
│   │   │   │   ├── partner-banner/
│   │   │   │   ├── toast/
│   │   │   │   ├── zoom-controls/
│   │   │   │   └── lightbox/
│   │   │   └── directives/
│   │   │       └── zoom/                  # Advanced zoom & pan directive
│   │   │           ├── zoom.directive.ts
│   │   │           └── zoom.types.ts
│   │   │
│   │   ├── layouts/
│   │   │   └── main-layout/               # Navbar + router outlet
│   │   │       └── main-layout.component.ts
│   │   │
│   │   ├── pages/                         # Top-level pages
│   │   │   ├── login.component.ts         # 6-digit code login
│   │   │   ├── share-login.component.ts   # Share token login
│   │   │   └── preview-login.component.ts # Admin preview login
│   │   │
│   │   ├── app-routing.module.ts          # Main routes configuration
│   │   ├── app.module.ts                  # Root module
│   │   └── app.component.ts               # Root component
│   │
│   ├── environments/
│   │   ├── environment.ts                 # Development API URL
│   │   └── environment.prod.ts
│   │
│   ├── styles/
│   │   ├── schedule-card.scss
│   │   └── schedule-card-tokens.scss
│   │
│   ├── styles.scss                        # Global styles (Tailwind)
│   ├── index.html                         # HTML entry point
│   └── main.ts                            # Bootstrap application
│
├── angular.json                           # Angular CLI config (port 4205)
├── tailwind.config.js                     # Tailwind configuration
├── tsconfig.json                          # TypeScript config
├── package.json                           # Dependencies
└── README.md
```

---

## Core Features

### 1. Authentication System

Three authentication methods:

#### Code-Based Login
- 6-digit numeric code entry
- Rate limiting (429 response)
- Validation on both client and server
- Token stored in localStorage

#### Share Token Login (`/share/:token`)
- 64-character hex token
- Format validation: `/^[a-f0-9]{64}$/i`
- Automatic redirect to `/home` on success
- Error handling with fallback to code login

#### Admin Preview Login (`/preview/:token`)
- One-time preview token for administrators
- Same flow as share token

**Token Management:**
```typescript
// Storage keys
tablo_auth_token    // Bearer token
tablo_project       // Cached project data (JSON)

// HTTP requests include:
Authorization: Bearer <token>
X-XSRF-TOKEN: <csrf_token>  // From cookies
withCredentials: true        // Laravel Sanctum
```

### 2. Dashboard (Home Component)

**Features:**
- Project information display
- Contact details (coordinators, contacts)
- Status badge (color-coded from Tablo Status or legacy status)
- Photo date display with format: "2024. január 15."
- Schedule reminder dialog (with snooze/halasztas functionality)
- Share functionality:
  - Native share API on mobile
  - Copy to clipboard on desktop
  - Toast notification feedback

**LocalStorage Namespace:**
```
kv:{projectId}:schedule_reminder_dismissed_until
kv:{projectId}:schedule_reminder_last_shown
```

### 3. Sample Photos

**Features:**
- Grid layout with thumbnail images
- Click to open full-size lightbox
- Advanced zoom capabilities:
  - Desktop: Mouse wheel zoom, mouse pan
  - Mobile: Pinch-to-zoom, double-tap zoom, touch pan
  - Keyboard: +/- to zoom, Arrow keys to navigate, 0 to reset
- Image description toggle
- Navigation arrows for image browsing
- Relative time display ("2 órája", "1 napja")
- Performance optimized with cache-busters

**API Endpoints:**
- `GET /api/tablo-frontend/samples` - Sample photos list
- `GET /api/tablo-frontend/project-info` - Project metadata

### 4. Order Data Management

**Displays:**
- Contact information (name, email, phone)
- School/class details
- Student & teacher counts
- Design preferences (color, font, sort type)
- Descriptions (general, student, teacher)
- AI summary & tags
- PDF download link
- Order date

**API Endpoint:**
- `GET /api/tablo-frontend/order-data` - Order data retrieval

### 5. Missing Persons Tracking

**Features (Lazy-loaded module):**
- Lists students & teachers without photos
- Searchable by name and local ID
- Filterable by type (all/student/teacher)
- Statistics display (count without photos)
- Grouped display (students section / teachers section)

**Reactive Filtering:**
- Uses RxJS `combineLatest` with BehaviorSubjects
- Real-time filtering as user types/changes filters

**API Integration:**
- Data comes from `/tablo-frontend/validate-session` response
- `project.missingPersons` array
- `project.missingStats` with counts

### 6. Responsive Navbar

**Dynamic Breakpoint System:**
- Uses ResizeObserver (Safari-compatible)
- Dynamically switches between desktop menu and mobile hamburger
- Hysteresis logic prevents menu flickering
- Mobile menu scroll lock (iOS-safe implementation)

**Features:**
- Tablókirály logo
- Project information badge (optional)
- Status color-coded indicator
- Navigation links (Home, Samples, Order Data, Missing Persons)
- Logout button
- Mobile drawer with Escape key and focus trap

**Status Badge Colors:**
```typescript
gray: 'bg-gray-100 text-gray-700'
blue: 'bg-blue-100 text-blue-700'
amber: 'bg-amber-100 text-amber-700'
green: 'bg-green-100 text-green-700'
purple: 'bg-purple-100 text-purple-700'
red: 'bg-red-100 text-red-700'
```

---

## Authentication & Security

### HTTP Interceptor

Located in `src/app/core/interceptors/auth.interceptor.ts`:

```typescript
// Adds to every request:
1. Authorization header with Bearer token
2. X-XSRF-TOKEN header from cookies (CSRF protection)
3. withCredentials: true (Laravel Sanctum cookie handling)

// Handles 401 Unauthorized:
- Clears auth data automatically
- Redirects to /login
- Excludes auth endpoints to avoid loops
```

### Auth Guard

Located in `src/app/core/guards/auth.guard.ts`:

```typescript
// Protects /home, /samples, /order-data, /missing-persons
canActivate():
  1. Check if token exists in localStorage
  2. Validate session on server (GET /validate-session)
  3. Allow or deny based on response
  4. Redirect to /login on failure
```

### Security Headers

HTML meta tag (Content Security Policy):
```html
- default-src 'self'
- script-src 'self'
- style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
- img-src 'self' data: https: blob:
- connect-src 'self' http://localhost:8000 https://api.tablokiraly.hu
```

### Password-less Authentication

No passwords - only:
- 6-digit codes (for code-based login)
- Share tokens (for external sharing)
- Preview tokens (for admin preview)

---

## Key Components

### NavbarComponent

**Inputs:**
```typescript
@Input() projectInfo: NavbarProjectInfo | null = null;
@Input() activePage: 'home' | 'samples' | 'order-data' | 'missing' = 'samples';
```

**Advanced Features:**
- Dynamic responsive behavior using ResizeObserver
- Mobile menu with body scroll lock
- Keyboard navigation (Escape, Tab focus trap)
- Signals for reactive menu state
- Debounced resize handling

**Signals Used:**
- `mobileMenuOpen` - Mobile menu visibility
- `isMobileMode` - Current responsive mode

### SamplesComponent

**Features:**
- Grid display with thumbnail images
- Lightbox with full-size image
- Advanced zoom directive integration
- Keyboard shortcuts:
  - `Escape` - Close lightbox
  - `←/→` - Navigate images (only at 1x zoom)
  - `+/-` - Zoom in/out
  - `0` - Reset zoom
- Long-press zoom buttons (continuous zoom)
- Cache-busters for full-size images

**Performance:**
- TrackBy function for *ngFor
- OnPush change detection
- Unsubscription pattern with destroy$
- RAF-optimized zoom directive

### MissingPersonsComponent (Lazy-loaded)

**Lazy Loading:**
```typescript
{
  path: 'missing-persons',
  component: MissingPersonsComponent,
  data: { page: 'missing' }
}
```

**State Management:**
- `searchQuery$` - BehaviorSubject for search input
- `filterType$` - BehaviorSubject for type filter
- `filteredPersons$` - Computed via combineLatest

### ZoomDirective

**Advanced Image Zoom & Pan:**

**Desktop:**
- Mouse wheel zoom (Ctrl/Cmd for faster zoom)
- Click and drag to pan
- Double-click to toggle 1x/2x zoom
- Cursor feedback (grab/grabbing)

**Mobile:**
- Pinch-to-zoom with scaling
- Double-tap to toggle 1x/2x
- Single-finger pan when zoomed
- Touch-action: none for proper gesture handling

**Performance:**
- RequestAnimationFrame optimization
- GPU-accelerated transforms
- NgZone runOutsideAngular for event listeners
- Signal-based state management

**Usage:**
```html
<img appZoom
     [zoomEnabled]="true"
     [zoomConfig]="{ maxZoom: 4 }"
     (zoomChange)="onZoomChange($event)" />
```

---

## Services

### AuthService

**Responsibilities:**
- Login with 6-digit code, share token, or preview token
- Token management (localStorage)
- Project data caching
- Session validation
- Logout with cache clearing

**Public Methods:**
```typescript
login(code: string): Observable<LoginResponse>
loginWithShareToken(token: string): Observable<LoginResponse>
loginWithPreviewToken(token: string): Observable<LoginResponse>
logout(): Observable<void>
validateSession(): Observable<ValidateSessionResponse>
updatePhotoDate(photoDate: string): Observable<{ success, photoDate }>
hasToken(): boolean
getToken(): string | null
getProject(): TabloProject | null
clearAuth(): void
```

**Observables:**
```typescript
project$: Observable<TabloProject | null>
isAuthenticated$: Observable<boolean>
```

### ToastService

**Usage:**
```typescript
toastService.success('Title', 'Message', duration?)
toastService.error('Title', 'Message', duration?)
toastService.info('Title', 'Message', duration?)
```

**Features:**
- Single toast at a time
- Auto-hide with configurable duration
- Reactive signal-based state
- Smooth fade-out animation

### ClipboardService

**Methods:**
```typescript
copy(text, label?): Promise<boolean>
copyEmail(email): Promise<boolean>
copyPhone(phone): Promise<boolean>
copyLink(url): Promise<boolean>
```

**Behavior:**
- Uses modern Clipboard API
- Shows toast with success/error feedback
- Label automatically prepended to toast message

### SamplesService

**Methods:**
```typescript
getSamples(): Observable<SamplesResponse>
getProjectInfo(): Observable<ProjectInfoResponse>
```

**Interfaces:**
```typescript
interface Sample {
  id: number
  fileName: string
  url: string
  thumbUrl: string
  description: string | null
  createdAt: string
}

interface ProjectInfo {
  id: number
  name: string
  schoolName: string | null
  className: string | null
  classYear: string | null
  status: string
  hasOrderAnalysis: boolean
  samplesCount: number
  hasMissingPersons: boolean
  tabloStatus: TabloStatus | null
  userStatus: string | null
  userStatusColor: string | null
}
```

### OrderDataService

**Methods:**
```typescript
getOrderData(): Observable<OrderDataResponse>
```

**Data Structure:**
```typescript
interface OrderData {
  // Contact
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  // School
  schoolName: string | null
  className: string | null
  classYear: string | null
  // Counts
  studentCount: number | null
  teacherCount: number | null
  // Design
  color: string | null
  fontFamily: string | null
  sortType: string | null
  // Content
  description: string | null
  studentDescription: string | null
  teacherDescription: string | null
  quote: string | null
  // AI
  aiSummary: string | null
  tags: string[]
  // PDF & Date
  pdfUrl: string | null
  orderDate: string | null
}
```

### ScheduleReminderService

**Purpose:**
- Manage schedule reminder dialog visibility
- LocalStorage-based state (no server calls)

**Methods:**
```typescript
shouldShowReminder(projectId: number, photoDate: string | null): boolean
markAsShown(projectId: number): void
setDismissal(projectId: number, days: number): void
clearReminder(projectId: number): void
```

**Logic:**
- Only shows if `photoDate` is null/undefined
- Not shown if dismissal is active
- Once per day maximum

---

## Styling & Design

### Tailwind CSS

**Configuration:** `tailwind.config.js`
```javascript
content: ["./src/**/*.{html,ts}"]
// Extends default theme (no custom colors in current config)
```

**Global Styles:** `src/styles.scss`
```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

// CSS variables
--bg-primary: #f8fafc  // Slate-50
--color-primary: #2563eb  // Blue-600
--color-primary-light: #3b82f6  // Blue-500
```

**Font Stack:**
```scss
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
             Roboto, 'Helvetica Neue', Arial, sans-serif
```

### Design System

**Principles:**
- Soft, modern aesthetic
- Rounded corners (border-radius: 8-16px)
- Light shadows (subtle elevation)
- Clean typography with system fonts
- Blue primary color (#2563eb)
- Gray neutral palette

**Component Spacing:**
- Padding: 1rem (16px) to 2rem (32px)
- Gap/margin: 0.5rem to 1.5rem
- Card rounded: 8px to 16px

### SCSS Features Used

**Variables & Mixins:**
- BEM naming convention
- Nested selectors
- Partial imports

**Example Structure:**
```scss
.component {
  &__element {
    &--modifier {
      // Styles
    }
  }
}
```

---

## Development Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- Angular CLI 16.2.0

### Installation

```bash
cd frontend-tablo
npm install
```

### Development Server

```bash
npm start
# or: ng serve

# Default: http://localhost:4200
# Configured port: 4205 (in angular.json)
```

**Auto-reload:** Browser automatically refreshes when source files change

### Environment Configuration

**Development:** `src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

**Production:** Set via deployment/build configuration

### Code Generation

```bash
# Generate component
ng generate component features/my-feature/my.component

# Generate service
ng generate service core/services/my.service

# Generate directive
ng generate directive shared/directives/my.directive

# Current schematics config (angular.json):
# - Default style: scss
# - Skip tests: true
```

---

## Build & Deployment

### Build for Production

```bash
npm run build
# or: ng build

# Output: dist/frontend-tablo/
# Configuration: Production mode (optimization enabled)
```

**Build Budgets (angular.json):**
- Initial bundle: 500kb warning, 1mb error
- Component styles: 6kb warning, 12kb error

**Output Hashing:** All files (for cache busting)

### Build Artifacts

```
dist/frontend-tablo/
├── index.html
├── main-HASH.js      (Main bundle)
├── polyfills-HASH.js
├── styles-HASH.css
├── favicon.ico
└── assets/
```

### Deployment Considerations

**Static Hosting:**
- Can be served from any static host (nginx, Apache, S3, Vercel, Netlify)
- Requires SPA routing setup (fallback to index.html for all routes)

**nginx Example:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**API Integration:**
- Change `environment.apiUrl` in build configuration
- CORS must be enabled on backend
- CSP headers configured in index.html

---

## Performance Considerations

### Change Detection Strategy

**OnPush Used:**
- `HomeComponent`
- `SamplesComponent`
- `MissingPersonsComponent`
- `NavbarComponent`
- `OrderDataComponent`

**Benefits:**
- Only runs when @Input changes or event fires
- Reduces unnecessary change detection cycles
- Requires explicit `markForCheck()` in async operations

### TrackBy Functions

Implemented for all *ngFor loops with lists:

```typescript
// Samples
trackBySample(index: number, sample: Sample): number {
  return sample.id;
}

// Missing persons
trackByPerson(index: number, person: MissingPerson): number {
  return person.id;
}

// Order data tags
trackByTag(index: number, tag: string): string {
  return tag;
}
```

### Memory Management

**Unsubscription Pattern:**
```typescript
private readonly destroy$ = new Subject<void>();

ngOnInit() {
  this.service.data$
    .pipe(takeUntil(this.destroy$))
    .subscribe(...);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Image Optimization

**Lightbox:**
- Thumbnail displayed in grid
- Full-size loaded on demand
- Cache-busters prevent stale image caching

**Cache-buster Implementation:**
```typescript
const separator = url.includes('?') ? '&' : '?';
return `${url}${separator}full=1`;
```

### Zoom Directive Optimization

**RAF Usage:**
```typescript
private rafId: number | null = null;
private pendingUpdate = false;

// Pinch-to-zoom update
this.rafId = requestAnimationFrame(() => {
  // Heavy calculations
  this.pendingUpdate = false;
});
```

**NgZone Optimization:**
```typescript
// Event listeners outside Angular zone
this.ngZone.runOutsideAngular(() => {
  el.addEventListener('wheel', wheelFn);
});

// Re-enter zone for change detection
this.ngZone.run(() => {
  this.zoomChange.emit(newZoom);
});
```

---

## Testing

### Test Configuration

**Framework:** Jasmine/Karma
**Configuration:** `angular.json` test builder with Karma

**Commands:**
```bash
npm test
# or: ng test

# Runs in watch mode
# Coverage reports: coverage/
```

### Testing Patterns

**Service Testing:**
```typescript
it('should set token on login', () => {
  const response: LoginResponse = {...};
  spyOn(authService, 'login').and.returnValue(of(response));
  // Test
});
```

**Component Testing:**
```typescript
it('should display project info', () => {
  component.project$ = of(mockProject);
  fixture.detectChanges();
  expect(compiled.querySelector('.project-name').textContent).toContain('Project');
});
```

**Guard Testing:**
```typescript
it('should allow navigation if token valid', () => {
  spyOn(authService, 'validateSession').and.returnValue(of({ valid: true }));
  const result = guard.canActivate(route, state);
  expect(result).toBe(true);
});
```

---

## API Integration

### Endpoints Used

All endpoints require Bearer token in Authorization header:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login-tablo-code` | Login with 6-digit code |
| POST | `/auth/login-tablo-share` | Login with share token |
| POST | `/auth/login-tablo-preview` | Login with preview token |
| GET | `/tablo-frontend/validate-session` | Validate current session |
| POST | `/tablo-frontend/logout` | Logout current user |
| POST | `/tablo-frontend/update-schedule` | Update photo date |
| GET | `/tablo-frontend/samples` | Get sample photos |
| GET | `/tablo-frontend/project-info` | Get project metadata |
| GET | `/tablo-frontend/order-data` | Get order data |

### Request/Response Patterns

**Success Response:**
```json
{
  "success": true,
  "data": {...},
  "message": "Success"
}
```

**Error Response:**
```json
{
  "message": "Error description",
  "errors": {...}
}
```

**Login Response:**
```json
{
  "user": {
    "id": number,
    "name": string,
    "email": string | null,
    "type": "tablo-guest"
  },
  "project": {...},
  "token": "Bearer token string"
}
```

---

## Troubleshooting

### Common Issues

**Issue:** 401 Unauthorized errors
- **Solution:** Token expired or invalid, user redirected to /login
- **Check:** localStorage for `tablo_auth_token`

**Issue:** CORS errors in browser console
- **Solution:** Backend CSP headers or CORS misconfiguration
- **Check:** nginx/server CORS headers

**Issue:** Images not loading in lightbox
- **Solution:** Cache-buster not working or incorrect URL
- **Check:** Network tab to verify image URL

**Issue:** Mobile menu not closing
- **Solution:** ResizeObserver not detecting breakpoint
- **Check:** Browser console for errors, window size

**Issue:** Zoom not working on touch
- **Solution:** touch-action CSS not applied
- **Check:** Zoom directive initialization

---

## Contributing Guidelines

### File Naming

- Components: `feature-name.component.ts`
- Services: `feature-name.service.ts`
- Directives: `feature-name.directive.ts`
- Styles: `component-name.component.scss`

### Code Style

- Angular Style Guide compliance
- Type strict mode enabled
- OnPush change detection preferred
- Proper unsubscription patterns
- Hungarian language for UI strings
- English for code comments

### Component Template Structure

```html
<!-- Conditional rendering -->
<ng-container *ngIf="loading; else loaded">
  Loading...
</ng-container>

<ng-template #loaded>
  <div *ngFor="let item of items; trackBy: trackByFn">
    {{ item.name }}
  </div>
</ng-template>
```

### Service Patterns

```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  private readonly API = 'endpoint';

  constructor(private http: HttpClient) {}

  getData(): Observable<Data> {
    return this.http.get<Data>(`${environment.apiUrl}${this.API}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => new Error('Error message'));
  }
}
```

---

## Additional Resources

- [Angular Documentation](https://angular.io/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [RxJS Operators](https://rxjs.dev/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated:** January 5, 2026
**Maintained By:** Photo Stack Team
