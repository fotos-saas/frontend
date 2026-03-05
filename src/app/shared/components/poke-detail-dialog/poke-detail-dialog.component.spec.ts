import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PokeDetailDialogComponent } from './poke-detail-dialog.component';
import { PokeService } from '../../../core/services/poke.service';
import { DateUtilsService } from '../../services/date-utils.service';

describe('PokeDetailDialogComponent', () => {
  let component: PokeDetailDialogComponent;
  let fixture: ComponentFixture<PokeDetailDialogComponent>;

  beforeEach(async () => {
    const mockPokeService = {
      sentPokes: vi.fn().mockReturnValue([]),
      receivedPokes: vi.fn().mockReturnValue([]),
      loadSentPokes: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockDateUtilsService = {
      getRelativeTime: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [PokeDetailDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PokeService, useValue: mockPokeService },
        { provide: DateUtilsService, useValue: mockDateUtilsService }
      ],
    })
    .overrideComponent(PokeDetailDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokeDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('pokeId', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closed', () => {
    const spy = vi.fn();
    component.closed.subscribe(spy);
    component.closed.emit();
    expect(spy).toHaveBeenCalled();
  });
});
