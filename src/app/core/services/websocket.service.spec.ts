import { TestBed } from '@angular/core/testing';
import { WebsocketService } from './websocket.service';
import { LoggerService } from './logger.service';

// Mock Pusher and Echo
vi.mock('pusher-js', () => ({
  default: class MockPusher {},
}));

vi.mock('laravel-echo', () => ({
  default: class MockEcho {
    connector = { pusher: { connection: { bind: vi.fn() }, connect: vi.fn() } };
    channel = vi.fn();
    private = vi.fn();
    join = vi.fn();
    leave = vi.fn();
    leaveAllChannels = vi.fn();
    disconnect = vi.fn();
  },
}));

describe('WebsocketService', () => {
  let service: WebsocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
      ],
    });
    service = TestBed.inject(WebsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('alapértelmezett állapot', () => {
    it('disconnected állapotban indul', () => {
      expect(service.connectionState()).toBe('disconnected');
      expect(service.isConnected()).toBe(false);
      expect(service.errorMessage()).toBeNull();
    });
  });

  describe('channel / private / join', () => {
    it('null ha nincs kapcsolat', () => {
      expect(service.channel('test')).toBeNull();
      expect(service['private']('test')).toBeNull();
      expect(service.join('test')).toBeNull();
    });
  });

  describe('leave / leaveAll', () => {
    it('nem dob hibát ha nincs kapcsolat', () => {
      expect(() => service.leave('test')).not.toThrow();
      expect(() => service.leaveAll()).not.toThrow();
    });
  });

  describe('disconnect', () => {
    it('disconnected állapotba áll', () => {
      service.disconnect();
      expect(service.connectionState()).toBe('disconnected');
    });
  });
});
