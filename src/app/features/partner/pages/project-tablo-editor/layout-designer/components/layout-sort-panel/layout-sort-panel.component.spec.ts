import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LayoutSortPanelComponent } from './layout-sort-panel.component';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutDesignerSortService } from '../../layout-designer-sort.service';

describe('LayoutSortPanelComponent', () => {
  let component: LayoutSortPanelComponent;
  let fixture: ComponentFixture<LayoutSortPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutSortPanelComponent],
      providers: [
        { provide: LayoutDesignerStateService, useValue: {} },
        { provide: LayoutDesignerSortService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutSortPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
