import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GalleryMonitoringComponent } from './gallery-monitoring.component';
import { GalleryMonitoringActionsService } from './gallery-monitoring-actions.service';

describe('GalleryMonitoringComponent', () => {
  let component: GalleryMonitoringComponent;
  let fixture: ComponentFixture<GalleryMonitoringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryMonitoringComponent],
      providers: [
        { provide: GalleryMonitoringActionsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GalleryMonitoringComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
