import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SamplesLightboxComponent } from './samples-lightbox.component';
import { DatePipe } from '@angular/common';

describe('SamplesLightboxComponent', () => {
  let component: SamplesLightboxComponent;
  let fixture: ComponentFixture<SamplesLightboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SamplesLightboxComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(SamplesLightboxComponent, {
      set: { imports: [DatePipe], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(SamplesLightboxComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('samples', []);
    fixture.componentRef.setInput('currentIndex', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close', () => {
    const spy = vi.fn();
    component.close.subscribe(spy);
    component.close.emit();
    expect(spy).toHaveBeenCalled();
  });
});
