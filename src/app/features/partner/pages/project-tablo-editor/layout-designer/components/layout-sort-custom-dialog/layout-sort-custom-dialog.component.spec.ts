import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LayoutSortCustomDialogComponent } from './layout-sort-custom-dialog.component';
import { LayoutDesignerSortService } from '../../layout-designer-sort.service';

describe('LayoutSortCustomDialogComponent', () => {
  let component: LayoutSortCustomDialogComponent;
  let fixture: ComponentFixture<LayoutSortCustomDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutSortCustomDialogComponent],
      providers: [
        { provide: LayoutDesignerSortService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutSortCustomDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
