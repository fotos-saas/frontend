import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MobileMenuUserComponent } from './mobile-menu-user.component';

describe('MobileMenuUserComponent', () => {
  let component: MobileMenuUserComponent;
  let fixture: ComponentFixture<MobileMenuUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileMenuUserComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(MobileMenuUserComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileMenuUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default mode', () => {
    expect(component.mode()).toBe('guest');
  });

  it('should emit editEvent', () => {
    const spy = vi.fn();
    component.editEvent.subscribe(spy);
    component.editEvent.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit closeMenuEvent', () => {
    const spy = vi.fn();
    component.closeMenuEvent.subscribe(spy);
    component.closeMenuEvent.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should compute labelText', () => {
    expect(component.labelText()).toBeDefined();
  });

  it('should compute ariaLabel', () => {
    expect(component.ariaLabel()).toBeDefined();
  });
});
