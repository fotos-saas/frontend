# Osztály Hírek - Real-time WebSocket Architektúra

> Verzió: 1.0
> Dátum: 2025-01-19
> Cél: Élő frissítések push nélkül

---

## 🎯 Miért WebSocket?

### Probléma HTTP-vel

```
POLLING (régi módszer):
┌────────┐                      ┌────────┐
│ Client │ ───── GET /feed ───► │ Server │
│        │ ◄──── Response ───── │        │
│        │                      │        │
│        │  ... 10 sec múlva... │        │
│        │                      │        │
│        │ ───── GET /feed ───► │        │
│        │ ◄──── Response ───── │        │
└────────┘                      └────────┘

❌ Sok felesleges request
❌ Késleltetés (max 10 sec)
❌ Szerver terhelés
❌ Mobilon akkumulátor
```

### Megoldás WebSocket-tel

```
WEBSOCKET (valós idejű):
┌────────┐                      ┌────────┐
│ Client │ ══════ WS ══════════ │ Server │
│        │      CONNECTION      │        │
│        │                      │        │
│        │                      │ (Új    │
│        │ ◄──── push ──────────│ esemény│
│        │                      │ történt│
│        │                      │        │
│        │ ◄──── push ──────────│ )      │
└────────┘                      └────────┘

✅ Egy kapcsolat, sok üzenet
✅ Azonnali push (< 100ms)
✅ Kevesebb szerver terhelés
✅ Akkumulátor kímélő
```

---

## 🏗️ Architektúra

### Teljes Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ Component    │    │ NewsService  │    │ WebSocketService     │  │
│  │              │───►│              │───►│                      │  │
│  │ - feed       │    │ - _feed      │    │ - connection         │  │
│  │ - UI update  │◄───│ - signals    │◄───│ - reconnect logic    │  │
│  └──────────────┘    └──────────────┘    └──────────┬───────────┘  │
│                                                      │              │
└──────────────────────────────────────────────────────┼──────────────┘
                                                       │
                                          WebSocket    │
                                          Connection   │
                                                       │
┌──────────────────────────────────────────────────────┼──────────────┐
│                           BACKEND                    │              │
│                                                      ▼              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ Laravel      │    │ Event        │    │ WebSocket Server     │  │
│  │ Controller   │───►│ Broadcaster  │───►│ (Laravel Reverb /    │  │
│  │              │    │              │    │  Pusher / Soketi)    │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────┐                                                   │
│  │ Database     │                                                   │
│  └──────────────┘                                                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📡 WebSocket Service (Frontend)

### websocket.service.ts

```typescript
import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';

interface WebSocketMessage {
  event: string;
  channel: string;
  data: unknown;
}

type EventHandler = (data: unknown) => void;

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private auth = inject(AuthService);

  // Connection state
  private socket: WebSocket | null = null;
  private readonly _isConnected = signal(false);
  private readonly _connectionError = signal<string | null>(null);

  // Public state
  readonly isConnected = this._isConnected.asReadonly();
  readonly connectionError = this._connectionError.asReadonly();

  // Event handlers registry
  private handlers = new Map<string, Set<EventHandler>>();

  // Reconnection config
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 sec
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  // Subscribed channels
  private subscribedChannels = new Set<string>();

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const token = this.auth.token();
    if (!token) {
      console.warn('No auth token, skipping WebSocket connection');
      return;
    }

    const wsUrl = `${environment.wsUrl}?token=${token}`;

    try {
      this.socket = new WebSocket(wsUrl);
      this.setupEventListeners();
    } catch (error) {
      this._connectionError.set('Failed to create WebSocket connection');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.clearReconnectTimer();
    this.subscribedChannels.clear();

    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }

    this._isConnected.set(false);
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string): void {
    this.subscribedChannels.add(channel);

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendMessage({
        action: 'subscribe',
        channel
      });
    }
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string): void {
    this.subscribedChannels.delete(channel);

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendMessage({
        action: 'unsubscribe',
        channel
      });
    }
  }

  /**
   * Register event handler
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  /**
   * Send message to server
   */
  private sendMessage(data: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('✅ WebSocket connected');
      this._isConnected.set(true);
      this._connectionError.set(null);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;

      // Resubscribe to channels
      this.subscribedChannels.forEach(channel => {
        this.sendMessage({ action: 'subscribe', channel });
      });
    };

    this.socket.onclose = (event) => {
      console.log('❌ WebSocket closed:', event.code, event.reason);
      this._isConnected.set(false);

      // Don't reconnect if intentional close
      if (event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this._connectionError.set('Connection error');
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    const { event, data } = message;

    // Get handlers for this event
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in handler for ${event}:`, error);
        }
      });
    }

    // Also emit to wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => handler(message));
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this._connectionError.set('Max reconnection attempts reached');
      return;
    }

    this.clearReconnectTimer();

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff (1s, 2s, 4s, 8s, 16s)
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
```

---

## 📰 News Service WebSocket Integration

### news.service.ts (kibővítve)

```typescript
@Injectable({ providedIn: 'root' })
export class NewsService implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private ws = inject(WebSocketService);
  private project = inject(ProjectService);
  private destroyRef = inject(DestroyRef);

  // State
  private readonly _feed = signal<FeedItem[]>([]);
  private readonly _notifications = signal<Notification[]>([]);
  private readonly _unreadCount = signal(0);

  // Public
  readonly feed = this._feed.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();

  constructor() {
    // Connect WebSocket when service initializes
    this.initializeWebSocket();
  }

  /**
   * Setup WebSocket connection and handlers
   */
  private initializeWebSocket(): void {
    // Connect
    this.ws.connect();

    // Subscribe to project channel when connected
    effect(() => {
      if (this.ws.isConnected()) {
        const projectId = this.project.currentProjectId();
        if (projectId) {
          this.ws.subscribe(`project.${projectId}.feed`);
          this.ws.subscribe(`user.${this.auth.userId()}.notifications`);
        }
      }
    });

    // === EVENT HANDLERS ===

    // New feed item
    this.ws.on('feed.new', (data: FeedItem) => {
      console.log('📰 New feed item:', data);

      // Prepend to feed
      this._feed.update(items => [data, ...items]);

      // Update unread count
      this._unreadCount.update(c => c + 1);
    });

    // Feed item updated (e.g., vote count changed)
    this.ws.on('feed.updated', (data: { id: number; changes: Partial<FeedItem> }) => {
      this._feed.update(items =>
        items.map(item =>
          item.id === data.id ? { ...item, ...data.changes } : item
        )
      );
    });

    // Feed item deleted
    this.ws.on('feed.deleted', (data: { id: number }) => {
      this._feed.update(items => items.filter(item => item.id !== data.id));
    });

    // New notification
    this.ws.on('notification.new', (data: Notification) => {
      console.log('🔔 New notification:', data);

      this._notifications.update(items => [data, ...items]);
      this._unreadCount.update(c => c + 1);
    });

    // Announcement updated (new banner)
    this.ws.on('announcement.new', (data: Announcement) => {
      this._activeAnnouncement.set(data);
    });

    // Someone joined project
    this.ws.on('project.user_joined', (data: { userId: number; userName: string }) => {
      // Add to feed as a system message
      const joinItem: FeedItem = {
        id: Date.now(), // Temporary ID
        type: 'guest_joined',
        title: 'Új tag csatlakozott',
        content: `${data.userName} csatlakozott az osztályhoz`,
        createdAt: new Date().toISOString(),
        isRead: false
      };
      this._feed.update(items => [joinItem, ...items]);
    });
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    const projectId = this.project.currentProjectId();
    if (projectId) {
      this.ws.unsubscribe(`project.${projectId}.feed`);
    }
  }
}
```

---

## 🖥️ Backend Implementation (Laravel)

### WebSocket Events

```php
// app/Events/FeedItemCreated.php
<?php

namespace App\Events;

use App\Models\FeedItem;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class FeedItemCreated implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(
        public FeedItem $feedItem
    ) {}

    /**
     * Channel(s) to broadcast on
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('project.' . $this->feedItem->project_id . '.feed'),
        ];
    }

    /**
     * Event name
     */
    public function broadcastAs(): string
    {
        return 'feed.new';
    }

    /**
     * Data to send
     */
    public function broadcastWith(): array
    {
        return $this->feedItem->toFeedArray();
    }
}
```

### Notification Event

```php
// app/Events/NotificationCreated.php
<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class NotificationCreated implements ShouldBroadcast
{
    public function __construct(
        public Notification $notification
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->notification->user_id . '.notifications'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.new';
    }

    public function broadcastWith(): array
    {
        return $this->notification->toArray();
    }
}
```

### Broadcasting from Controller

```php
// app/Http/Controllers/VotingController.php

public function store(CreateVoteRequest $request, Project $project)
{
    // Create vote
    $vote = $project->polls()->create($request->validated());

    // Create feed item
    $feedItem = FeedItem::create([
        'project_id' => $project->id,
        'type' => 'poll_created',
        'title' => 'Új szavazás indult',
        'content' => $vote->title,
        'reference_type' => 'poll',
        'reference_id' => $vote->id,
    ]);

    // 🔥 BROADCAST TO ALL PROJECT MEMBERS
    broadcast(new FeedItemCreated($feedItem))->toOthers();

    // Create notifications for each member
    $project->members->each(function ($member) use ($feedItem) {
        $notification = Notification::create([
            'user_id' => $member->id,
            'type' => 'poll_created',
            'title' => 'Új szavazás!',
            'message' => $feedItem->content,
            'action_url' => "/voting/{$feedItem->reference_id}",
        ]);

        // 🔥 BROADCAST TO USER
        broadcast(new NotificationCreated($notification))->toOthers();
    });

    return response()->json($vote, 201);
}
```

### Channel Authorization

```php
// routes/channels.php
<?php

use Illuminate\Support\Facades\Broadcast;

// Project feed channel - only project members can access
Broadcast::channel('project.{projectId}.feed', function ($user, $projectId) {
    return $user->projects()->where('project_id', $projectId)->exists();
});

// User notifications - only the user themselves
Broadcast::channel('user.{userId}.notifications', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
```

### Laravel Reverb Setup

```php
// config/broadcasting.php
'connections' => [
    'reverb' => [
        'driver' => 'reverb',
        'key' => env('REVERB_APP_KEY'),
        'secret' => env('REVERB_APP_SECRET'),
        'app_id' => env('REVERB_APP_ID'),
        'options' => [
            'host' => env('REVERB_HOST', '127.0.0.1'),
            'port' => env('REVERB_PORT', 8080),
            'scheme' => env('REVERB_SCHEME', 'http'),
        ],
    ],
],
```

```bash
# .env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=localhost
REVERB_PORT=8080
```

---

## 🔄 Connection States & UI

### Component

```typescript
// connection-status.component.ts
@Component({
  selector: 'app-connection-status',
  template: `
    @if (ws.connectionError()) {
      <div class="connection-error">
        <span class="icon">⚠️</span>
        <span>Kapcsolat megszakadt</span>
        <button (click)="reconnect()">Újracsatlakozás</button>
      </div>
    } @else if (!ws.isConnected()) {
      <div class="connection-pending">
        <span class="spinner"></span>
        <span>Csatlakozás...</span>
      </div>
    }
  `,
  styles: [`
    .connection-error {
      background: #FEF2F2;
      color: #991B1B;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .connection-pending {
      background: #FEF9C3;
      color: #854D0E;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class ConnectionStatusComponent {
  ws = inject(WebSocketService);

  reconnect(): void {
    this.ws.disconnect();
    this.ws.connect();
  }
}
```

---

## 📊 Event Flow Diagram

### Új Szavazás Létrehozása

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Kapcsolat-   │     │   Backend    │     │    Diák      │
│ tartó        │     │   Server     │     │   (másik)    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ POST /polls        │                    │
       │───────────────────►│                    │
       │                    │                    │
       │                    │ Create poll        │
       │                    │ Create feed_item   │
       │                    │ Create notification│
       │                    │                    │
       │  201 Created       │                    │
       │◄───────────────────│                    │
       │                    │                    │
       │                    │ broadcast()        │
       │                    │ ─ ─ ─ ─ ─ ─ ─ ─ ─►│
       │                    │                    │
       │                    │     WS: feed.new   │
       │                    │─ ─ ─ ─ ─ ─ ─ ─ ─ ─►│
       │                    │                    │
       │                    │  WS: notification  │
       │                    │─ ─ ─ ─ ─ ─ ─ ─ ─ ─►│
       │                    │                    │
       │                    │                    │ UI Update
       │                    │                    │ (< 100ms)
       │                    │                    │
```

---

## ✅ Checklist

### Frontend
- [ ] WebSocketService implementálva
- [ ] Auto-reconnect exponential backoff
- [ ] Channel subscription management
- [ ] Event handlers in NewsService
- [ ] Connection status UI

### Backend
- [ ] Laravel Reverb/Pusher setup
- [ ] FeedItemCreated event
- [ ] NotificationCreated event
- [ ] Channel authorization
- [ ] Broadcasting from controllers

### Events
- [ ] feed.new - új feed item
- [ ] feed.updated - módosítás
- [ ] feed.deleted - törlés
- [ ] notification.new - új értesítés
- [ ] announcement.new - új hirdetmény
- [ ] project.user_joined - új tag

### Testing
- [ ] WebSocket connection test
- [ ] Reconnection test
- [ ] Event broadcast test
- [ ] Channel authorization test
