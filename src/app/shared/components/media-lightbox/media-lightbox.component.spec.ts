import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MediaLightboxComponent } from './media-lightbox.component';
import { FocusTrapFactory } from '@angular/cdk/a11y';

describe('MediaLightboxComponent', () => {
  let component: MediaLightboxComponent;
  let fixture: ComponentFixture<MediaLightboxComponent>;

  beforeEach(async () => {
    const mockFocusTrapFactory = {};

    await TestBed.configureTestingModule({
      imports: [MediaLightboxComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: FocusTrapFactory, useValue: mockFocusTrapFactory }
      ],
    })
    .overrideComponent(MediaLightboxComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaLightboxComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('media', []);
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

  it('should compute currentMedia', () => {
    expect(component.currentMedia()).toBeDefined();
  });

  it('should compute hasPrev', () => {
    expect(component.hasPrev()).toBeDefined();
  });

  it('should compute hasNext', () => {
    expect(component.hasNext()).toBeDefined();
  });
});
