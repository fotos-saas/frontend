import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LayoutCanvasComponent } from './layout-canvas.component';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';

describe('LayoutCanvasComponent', () => {
  let component: LayoutCanvasComponent;
  let fixture: ComponentFixture<LayoutCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutCanvasComponent],
      providers: [
        { provide: LayoutDesignerStateService, useValue: {
          persons: vi.fn().mockReturnValue([]),
          selectedIds: vi.fn().mockReturnValue(new Set()),
          gridSize: vi.fn().mockReturnValue({ cols: 5, rows: 5 }),
          layout: vi.fn().mockReturnValue([]),
          isReady: vi.fn().mockReturnValue(false),
        } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(LayoutCanvasComponent, {
      set: { imports: [], template: '<div></div>' }
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayoutCanvasComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
