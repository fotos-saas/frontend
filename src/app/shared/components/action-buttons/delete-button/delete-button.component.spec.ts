import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DeleteButtonComponent } from './delete-button.component';

describe('DeleteButtonComponent', () => {
  let component: DeleteButtonComponent;
  let fixture: ComponentFixture<DeleteButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteButtonComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(DeleteButtonComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default display', () => {
    expect(component.display()).toBe('icon-only');
  });

  it('should have default label', () => {
    expect(component.label()).toBe('Törlés');
  });

  it('should have default disabled', () => {
    expect(component.disabled()).toBe(false);
  });

  it('should emit clicked', () => {
    const spy = vi.fn();
    component.clicked.subscribe(spy);
    component.clicked.emit();
    expect(spy).toHaveBeenCalled();
  });
});
