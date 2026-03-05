import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SamplePackageDialogComponent } from './sample-package-dialog.component';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';

describe('SamplePackageDialogComponent', () => {
  let component: SamplePackageDialogComponent;
  let fixture: ComponentFixture<SamplePackageDialogComponent>;

  beforeEach(async () => {
    const mockPartnerService = {};
    const mockToastService = {};

    await TestBed.configureTestingModule({
      imports: [SamplePackageDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PartnerService, useValue: mockPartnerService },
        { provide: ToastService, useValue: mockToastService }
      ],
    })
    .overrideComponent(SamplePackageDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(SamplePackageDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projectId', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default initialTitle', () => {
    expect(component.initialTitle()).toBe('');
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
});
