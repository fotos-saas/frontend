import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PokeReceivedDialogComponent } from './poke-received-dialog.component';
import { PokeService } from '../../../core/services/poke.service';
import { DateUtilsService } from '../../services/date-utils.service';

describe('PokeReceivedDialogComponent', () => {
  let component: PokeReceivedDialogComponent;
  let fixture: ComponentFixture<PokeReceivedDialogComponent>;

  beforeEach(async () => {
    const mockPokeService = {
      receivedPokes: vi.fn().mockReturnValue([]),
      unreadCount: vi.fn().mockReturnValue(0),
      markAllAsRead: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      addReaction: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockDateUtilsService = {
      getRelativeTime: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [PokeReceivedDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PokeService, useValue: mockPokeService },
        { provide: DateUtilsService, useValue: mockDateUtilsService }
      ],
    })
    .overrideComponent(PokeReceivedDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokeReceivedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closedEvent', () => {
    const spy = vi.fn();
    component.closedEvent.subscribe(spy);
    component.closedEvent.emit();
    expect(spy).toHaveBeenCalled();
  });
});
