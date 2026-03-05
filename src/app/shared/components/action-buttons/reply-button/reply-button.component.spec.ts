import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReplyButtonComponent } from './reply-button.component';

describe('ReplyButtonComponent', () => {
  let component: ReplyButtonComponent;
  let fixture: ComponentFixture<ReplyButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReplyButtonComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ReplyButtonComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReplyButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default display', () => {
    expect(component.display()).toBe('icon-text');
  });

  it('should have default label', () => {
    expect(component.label()).toBe('Válasz');
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
