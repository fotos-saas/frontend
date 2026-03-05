import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SampleVersionDialogComponent } from './sample-version-dialog.component';
import { SampleVersionDialogFacade } from './sample-version-dialog-facade.service';

describe('SampleVersionDialogComponent', () => {
  let component: SampleVersionDialogComponent;
  let fixture: ComponentFixture<SampleVersionDialogComponent>;

  beforeEach(async () => {
    const mockSampleVersionDialogFacade = {};

    await TestBed.configureTestingModule({
      imports: [SampleVersionDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: SampleVersionDialogFacade, useValue: mockSampleVersionDialogFacade }
      ],
    })
    .overrideComponent(SampleVersionDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleVersionDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projectId', 0);
    fixture.componentRef.setInput('packageId', 0);
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

  it('should emit saved', () => {
    const spy = vi.fn();
    component.saved.subscribe(spy);
    component.saved.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should compute lightboxItems', () => {
    expect(component.lightboxItems()).toBeDefined();
  });

  it('should compute totalImageCount', () => {
    expect(component.totalImageCount()).toBeDefined();
  });
});
