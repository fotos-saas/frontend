import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HeatmapCellComponent } from './heatmap-cell.component';

describe('HeatmapCellComponent', () => {
  let component: HeatmapCellComponent;
  let fixture: ComponentFixture<HeatmapCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeatmapCellComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HeatmapCellComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
