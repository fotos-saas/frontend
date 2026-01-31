# Osztály Hírek - Tesztelési Terv

> Verzió: 1.0
> Dátum: 2025-01-19
> Cél: Átfogó tesztelési stratégia

---

## 🎯 Tesztelési Stratégia

### Tesztelési Piramis

```
                 /\
                /  \
               / E2E \        ← 10% (kritikus user journey)
              /______\
             /        \
            / Integrációs\    ← 20% (komponens interakciók)
           /______________\
          /                \
         /   Unit tesztek   \  ← 70% (service-ek, pure functions)
        /____________________\
```

### Eszközök

| Típus | Eszköz |
|-------|--------|
| Unit | Jest + Angular Testing Library |
| Integration | Jest + HttpClientTestingModule |
| E2E | Playwright |
| Visual | Chromatic (Storybook) |
| Performance | Lighthouse CI |
| A11y | axe-core |

---

## 🧪 Unit Tesztek

### news.service.spec.ts

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NewsService } from './news.service';

describe('NewsService', () => {
  let service: NewsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NewsService]
    });

    service = TestBed.inject(NewsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('loadFeed', () => {
    it('should load feed items', () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            { id: 1, type: 'poll_created', title: 'Test' }
          ],
          pagination: { hasMore: true, nextPage: 2 }
        }
      };

      service.loadFeed(1).subscribe(response => {
        expect(response.items.length).toBe(1);
        expect(response.pagination.hasMore).toBe(true);
      });

      const req = httpMock.expectOne('/api/v1/projects/123/feed?page=1&limit=10');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle network error', () => {
      service.loadFeed(1).subscribe({
        error: (err) => {
          expect(err.message).toContain('Network error');
        }
      });

      const req = httpMock.expectOne('/api/v1/projects/123/feed?page=1&limit=10');
      req.error(new ProgressEvent('error'));
    });

    it('should set loading signal correctly', () => {
      expect(service.loading()).toBe(false);

      service.loadFeed(1).subscribe();
      expect(service.loading()).toBe(true);

      const req = httpMock.expectOne('/api/v1/projects/123/feed?page=1&limit=10');
      req.flush({ success: true, data: { items: [], pagination: {} } });

      expect(service.loading()).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('should mark items as read', () => {
      service.markAsRead([1, 2, 3]).subscribe();

      const req = httpMock.expectOne('/api/v1/projects/123/feed/mark-read');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ itemIds: [1, 2, 3] });
      req.flush({ success: true });
    });
  });
});
```

---

### feed-card.component.spec.ts

```typescript
import { render, screen, fireEvent } from '@testing-library/angular';
import { FeedCardComponent } from './feed-card.component';

describe('FeedCardComponent', () => {
  const mockPollItem = {
    id: 1,
    type: 'poll_created',
    title: 'Új szavazás indult',
    content: 'Melyik sablon?',
    createdAt: '2025-01-19T10:00:00Z',
    isRead: false,
    poll: {
      id: 45,
      totalVoters: 25,
      currentVotes: 8,
      endsAt: '2025-01-21T18:00:00Z'
    },
    actionUrl: '/voting/45'
  };

  it('should render poll card correctly', async () => {
    await render(FeedCardComponent, {
      inputs: { item: mockPollItem }
    });

    expect(screen.getByText('Új szavazás indult')).toBeInTheDocument();
    expect(screen.getByText('Melyik sablon?')).toBeInTheDocument();
    expect(screen.getByText('8/25')).toBeInTheDocument();
  });

  it('should show unread indicator for unread items', async () => {
    await render(FeedCardComponent, {
      inputs: { item: { ...mockPollItem, isRead: false } }
    });

    expect(screen.getByTestId('unread-indicator')).toBeInTheDocument();
  });

  it('should emit cardClick on click', async () => {
    const { fixture } = await render(FeedCardComponent, {
      inputs: { item: mockPollItem }
    });

    const cardClickSpy = jest.spyOn(fixture.componentInstance.cardClick, 'emit');

    fireEvent.click(screen.getByRole('article'));

    expect(cardClickSpy).toHaveBeenCalledWith(mockPollItem);
  });

  it('should format relative time correctly', async () => {
    const recentItem = {
      ...mockPollItem,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    };

    await render(FeedCardComponent, {
      inputs: { item: recentItem }
    });

    expect(screen.getByText('2 órája')).toBeInTheDocument();
  });

  it('should truncate long content to 3 lines', async () => {
    const longContentItem = {
      ...mockPollItem,
      content: 'A'.repeat(500)
    };

    await render(FeedCardComponent, {
      inputs: { item: longContentItem }
    });

    const content = screen.getByTestId('card-content');
    expect(content).toHaveClass('line-clamp-3');
  });
});
```

---

### notification-bell.component.spec.ts

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/angular';
import { NotificationBellComponent } from './notification-bell.component';

describe('NotificationBellComponent', () => {
  it('should show badge with unread count', async () => {
    await render(NotificationBellComponent, {
      inputs: { unreadCount: 3 }
    });

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should hide badge when count is 0', async () => {
    await render(NotificationBellComponent, {
      inputs: { unreadCount: 0 }
    });

    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('should toggle dropdown on click', async () => {
    await render(NotificationBellComponent);

    const trigger = screen.getByRole('button', { name: /értesítések/i });

    expect(screen.queryByRole('menu')).not.toBeVisible();

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeVisible();
    });

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeVisible();
    });
  });

  it('should close dropdown on outside click', async () => {
    await render(NotificationBellComponent);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeVisible();
    });

    fireEvent.click(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeVisible();
    });
  });

  it('should close dropdown on Escape key', async () => {
    await render(NotificationBellComponent);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeVisible();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeVisible();
    });
  });
});
```

---

## 🔗 Integrációs Tesztek

### news-feed.integration.spec.ts

```typescript
import { render, screen, waitFor } from '@testing-library/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NewsFeedComponent } from './news-feed.component';
import { NewsService } from '../../core/services/news.service';
import { FeedCardComponent } from '../../shared/components/feed-card/feed-card.component';

describe('NewsFeed Integration', () => {
  const mockFeedItems = [
    {
      id: 1,
      type: 'poll_created',
      title: 'Szavazás',
      content: 'Test',
      createdAt: '2025-01-19T10:00:00Z',
      isRead: false
    },
    {
      id: 2,
      type: 'forum_post',
      title: 'Fórum',
      content: 'Test 2',
      createdAt: '2025-01-19T09:00:00Z',
      isRead: true
    }
  ];

  it('should render feed with cards', async () => {
    const mockService = {
      feed: signal(mockFeedItems),
      loading: signal(false),
      hasMore: signal(true),
      loadFeed: jest.fn()
    };

    await render(NewsFeedComponent, {
      imports: [FeedCardComponent],
      providers: [
        { provide: NewsService, useValue: mockService }
      ]
    });

    expect(screen.getByText('Szavazás')).toBeInTheDocument();
    expect(screen.getByText('Fórum')).toBeInTheDocument();
  });

  it('should show loading skeleton initially', async () => {
    const mockService = {
      feed: signal([]),
      loading: signal(true),
      hasMore: signal(false),
      loadFeed: jest.fn()
    };

    await render(NewsFeedComponent, {
      providers: [{ provide: NewsService, useValue: mockService }]
    });

    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(3);
  });

  it('should show empty state when no items', async () => {
    const mockService = {
      feed: signal([]),
      loading: signal(false),
      hasMore: signal(false),
      loadFeed: jest.fn()
    };

    await render(NewsFeedComponent, {
      providers: [{ provide: NewsService, useValue: mockService }]
    });

    expect(screen.getByText('Még nincsenek hírek')).toBeInTheDocument();
  });

  it('should load more on button click', async () => {
    const loadFeedSpy = jest.fn();
    const mockService = {
      feed: signal(mockFeedItems),
      loading: signal(false),
      hasMore: signal(true),
      loadFeed: loadFeedSpy
    };

    await render(NewsFeedComponent, {
      providers: [{ provide: NewsService, useValue: mockService }]
    });

    fireEvent.click(screen.getByText('Több betöltése'));

    expect(loadFeedSpy).toHaveBeenCalledWith(2);
  });
});
```

---

## 🎭 E2E Tesztek (Playwright)

### feed.e2e.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test.describe('News Feed', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('/home');
  });

  test('should display feed items', async ({ page }) => {
    await expect(page.locator('.feed-card')).toHaveCount.greaterThan(0);
  });

  test('should navigate to voting on poll card click', async ({ page }) => {
    const pollCard = page.locator('.feed-card').filter({ hasText: 'szavazás' }).first();
    await pollCard.click();

    await expect(page).toHaveURL(/\/voting\/\d+/);
  });

  test('should load more items on button click', async ({ page }) => {
    const initialCount = await page.locator('.feed-card').count();

    await page.click('button:has-text("Több betöltése")');

    await expect(page.locator('.feed-card')).toHaveCount.greaterThan(initialCount);
  });

  test('should refresh feed on pull-to-refresh', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const feed = page.locator('.news-feed');

    // Simulate pull-to-refresh
    await feed.evaluate((el) => {
      el.scrollTop = -100;
    });

    // Wait for refresh
    await expect(page.locator('.ptr-spinner')).toBeVisible();
    await expect(page.locator('.ptr-spinner')).toBeHidden();
  });
});

test.describe('Notification Bell', () => {
  test('should open dropdown on click', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');

    await expect(page.locator('.notification-dropdown')).toBeVisible();
  });

  test('should close dropdown on outside click', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');
    await expect(page.locator('.notification-dropdown')).toBeVisible();

    await page.click('body');

    await expect(page.locator('.notification-dropdown')).toBeHidden();
  });

  test('should mark all as read', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');
    await page.click('button:has-text("Mindet láttam")');

    await expect(page.locator('.notification-badge')).toBeHidden();
  });

  test('should navigate on notification click', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');

    const notification = page.locator('.notification-item').first();
    await notification.click();

    // Should navigate away from home
    await expect(page).not.toHaveURL('/home');
  });
});

test.describe('Announcement Banner', () => {
  test('should display important banner', async ({ page }) => {
    await expect(page.locator('.announcement-banner--important')).toBeVisible();
  });

  test('should dismiss banner on X click', async ({ page }) => {
    await page.click('.announcement-banner__dismiss');

    await expect(page.locator('.announcement-banner')).toBeHidden();
  });

  test('should remember dismissed banner', async ({ page }) => {
    await page.click('.announcement-banner__dismiss');

    // Reload page
    await page.reload();

    // Banner should still be hidden
    await expect(page.locator('.announcement-banner')).toBeHidden();
  });
});
```

---

## ♿ Accessibility Tesztek

### a11y.spec.ts

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('news feed should have no a11y violations', async ({ page }) => {
    await page.goto('/home');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('.news-feed')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('notification dropdown should have no a11y violations', async ({ page }) => {
    await page.goto('/home');
    await page.click('[data-testid="notification-bell"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('.notification-dropdown')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('feed cards should be keyboard navigable', async ({ page }) => {
    await page.goto('/home');

    // Tab to first card
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Skip nav

    const firstCard = page.locator('.feed-card').first();
    await expect(firstCard).toBeFocused();

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    const secondCard = page.locator('.feed-card').nth(1);
    await expect(secondCard).toBeFocused();

    // Open with Enter
    await page.keyboard.press('Enter');
    await expect(page).not.toHaveURL('/home');
  });

  test('notification dropdown should trap focus', async ({ page }) => {
    await page.goto('/home');
    await page.click('[data-testid="notification-bell"]');

    // Tab through all elements
    const focusableCount = await page.locator('.notification-dropdown button, .notification-dropdown a').count();

    for (let i = 0; i < focusableCount + 1; i++) {
      await page.keyboard.press('Tab');
    }

    // Should loop back to first element
    const firstElement = page.locator('.notification-dropdown').locator('button, a').first();
    await expect(firstElement).toBeFocused();
  });
});
```

---

## 🚀 Performance Tesztek

### lighthouse.config.js

```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4200/home'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
  },
};
```

### Bundle Size Check

```typescript
// bundle-size.spec.ts
import { execSync } from 'child_process';

describe('Bundle Size', () => {
  it('should not exceed budget', () => {
    const output = execSync('ng build --stats-json').toString();

    // Parse bundle stats
    const stats = require('./dist/stats.json');

    const mainBundle = stats.assets.find(a => a.name.startsWith('main'));

    // Max 250KB gzipped
    expect(mainBundle.size).toBeLessThan(250 * 1024);
  });
});
```

---

## 📱 Visual Regression Tesztek

### Storybook Stories

```typescript
// feed-card.stories.ts
import { Meta, StoryObj } from '@storybook/angular';
import { FeedCardComponent } from './feed-card.component';

const meta: Meta<FeedCardComponent> = {
  title: 'Components/FeedCard',
  component: FeedCardComponent,
};

export default meta;
type Story = StoryObj<FeedCardComponent>;

export const PollCard: Story = {
  args: {
    item: {
      id: 1,
      type: 'poll_created',
      title: 'Új szavazás indult',
      content: 'Melyik sablon tetszik?',
      createdAt: '2025-01-19T10:00:00Z',
      isRead: false,
      poll: {
        currentVotes: 8,
        totalVoters: 25
      }
    }
  }
};

export const ForumCard: Story = {
  args: {
    item: {
      id: 2,
      type: 'forum_post',
      title: 'Új hozzászólás',
      content: 'Szerintem a kék háttér...',
      createdAt: '2025-01-19T09:00:00Z',
      isRead: true,
      author: { name: 'Kovács Peti' },
      post: { likesCount: 3 }
    }
  }
};

export const UnreadCard: Story = {
  args: {
    item: {
      ...PollCard.args.item,
      isRead: false
    }
  }
};

export const ReadCard: Story = {
  args: {
    item: {
      ...PollCard.args.item,
      isRead: true
    }
  }
};
```

### Chromatic Config

```javascript
// .chromatic.json
{
  "projectId": "PROJECT_ID",
  "buildScriptName": "build-storybook",
  "exitOnceUploaded": true,
  "onlyChanged": true
}
```

---

## ✅ Tesztelési Checklist

### Unit Tesztek
- [ ] NewsService - loadFeed
- [ ] NewsService - markAsRead
- [ ] NewsService - signals (loading, hasMore)
- [ ] FeedCard - render all types
- [ ] FeedCard - click handler
- [ ] FeedCard - time formatting
- [ ] NotificationBell - badge display
- [ ] NotificationBell - dropdown toggle
- [ ] NotificationBell - outside click

### Integrációs Tesztek
- [ ] Feed + Service integration
- [ ] Feed + FeedCard rendering
- [ ] Notification + Service integration
- [ ] Router navigation on card click

### E2E Tesztek
- [ ] Full feed flow (load, scroll, more)
- [ ] Notification flow (open, click, mark read)
- [ ] Banner flow (display, dismiss)
- [ ] Mobile responsive
- [ ] Offline → Online

### A11y Tesztek
- [ ] axe-core no violations
- [ ] Keyboard navigation
- [ ] Screen reader flow
- [ ] Focus management

### Performance
- [ ] Lighthouse score > 90
- [ ] Bundle size < 250KB
- [ ] FCP < 2s
- [ ] LCP < 2.5s

### Visual
- [ ] All card variants
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Dark mode
