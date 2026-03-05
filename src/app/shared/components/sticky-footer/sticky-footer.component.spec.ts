import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StickyFooterComponent } from './sticky-footer.component';

describe('StickyFooterComponent', () => {
  let component: StickyFooterComponent;
  let fixture: ComponentFixture<StickyFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StickyFooterComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(StickyFooterComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(StickyFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default withSidebar', () => {
    expect(component.withSidebar()).toBe(false);
  });

  it('should have default isSaving', () => {
    expect(component.isSaving()).toBe(false);
  });

  it('should have default primaryLabel', () => {
    expect(component.primaryLabel()).toBe('Véglegesítés');
  });

  it('should have default primaryDisabled', () => {
    expect(component.primaryDisabled()).toBe(false);
  });

  it('should have default showSecondaryButton', () => {
    expect(component.showSecondaryButton()).toBe(true);
  });

  it('should have default secondaryLabel', () => {
    expect(component.secondaryLabel()).toBe('Mentés');
  });

  it('should have default secondaryDisabled', () => {
    expect(component.secondaryDisabled()).toBe(false);
  });

  it('should emit primaryClick', () => {
    const spy = vi.fn();
    component.primaryClick.subscribe(spy);
    component.primaryClick.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit secondaryClick', () => {
    const spy = vi.fn();
    component.secondaryClick.subscribe(spy);
    component.secondaryClick.emit();
    expect(spy).toHaveBeenCalled();
  });
});
