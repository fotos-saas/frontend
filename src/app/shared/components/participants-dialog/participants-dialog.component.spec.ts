import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ParticipantsDialogComponent } from './participants-dialog.component';

describe('ParticipantsDialogComponent', () => {
  let component: ParticipantsDialogComponent;
  let fixture: ComponentFixture<ParticipantsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticipantsDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ParticipantsDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParticipantsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default hasFullAccess', () => {
    expect(component.hasFullAccess()).toBe(false);
  });

  it('should have default isLoading', () => {
    expect(component.isLoading()).toBe(false);
  });

  it('should emit closeEvent', () => {
    const spy = vi.fn();
    component.closeEvent.subscribe(spy);
    component.closeEvent.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit refreshEvent', () => {
    const spy = vi.fn();
    component.refreshEvent.subscribe(spy);
    component.refreshEvent.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should compute summaryText', () => {
    expect(component.summaryText()).toBeDefined();
  });
});
