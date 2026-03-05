import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactionPickerComponent } from './reaction-picker.component';

describe('ReactionPickerComponent', () => {
  let component: ReactionPickerComponent;
  let fixture: ComponentFixture<ReactionPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactionPickerComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ReactionPickerComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReactionPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default disabled', () => {
    expect(component.disabled()).toBe(false);
  });

  it('should compute hasReactions', () => {
    expect(component.hasReactions()).toBeDefined();
  });

  it('should compute sortedReactions', () => {
    expect(component.sortedReactions()).toBeDefined();
  });
});
