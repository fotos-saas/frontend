import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LayoutLayerComponent } from './layout-layer.component';
import { LayoutDesignerDragService } from '../../layout-designer-drag.service';
import { LayoutDesignerSwapService } from '../../layout-designer-swap.service';

describe('LayoutLayerComponent', () => {
  let component: LayoutLayerComponent;
  let fixture: ComponentFixture<LayoutLayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutLayerComponent],
      providers: [
        { provide: LayoutDesignerDragService, useValue: {} },
        { provide: LayoutDesignerSwapService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutLayerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
