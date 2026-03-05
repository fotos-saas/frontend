import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LayoutDesignerComponent } from './layout-designer.component';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { PhotoshopService } from '../../../services/photoshop.service';
import { LayoutDesignerSortService } from './layout-designer-sort.service';
import { LayoutDesignerGridService } from './layout-designer-grid.service';
import { LayoutDesignerActionsService } from './layout-designer-actions.service';
import { LayoutDesignerPsBridgeService } from './layout-designer-ps-bridge.service';
import { LayoutDesignerSampleService } from './layout-designer-sample.service';

describe('LayoutDesignerComponent', () => {
  let component: LayoutDesignerComponent;
  let fixture: ComponentFixture<LayoutDesignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutDesignerComponent],
      providers: [
        { provide: LayoutDesignerStateService, useValue: {} },
        { provide: PhotoshopService, useValue: {} },
        { provide: LayoutDesignerSortService, useValue: {} },
        { provide: LayoutDesignerGridService, useValue: {} },
        { provide: LayoutDesignerActionsService, useValue: {} },
        { provide: LayoutDesignerPsBridgeService, useValue: {} },
        { provide: LayoutDesignerSampleService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutDesignerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
