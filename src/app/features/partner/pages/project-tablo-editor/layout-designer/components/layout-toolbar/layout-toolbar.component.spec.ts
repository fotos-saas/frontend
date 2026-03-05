import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LayoutToolbarComponent } from './layout-toolbar.component';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutDesignerActionsService } from '../../layout-designer-actions.service';
import { LayoutDesignerGridService } from '../../layout-designer-grid.service';

describe('LayoutToolbarComponent', () => {
  let component: LayoutToolbarComponent;
  let fixture: ComponentFixture<LayoutToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutToolbarComponent],
      providers: [
        { provide: LayoutDesignerStateService, useValue: {} },
        { provide: LayoutDesignerActionsService, useValue: {} },
        { provide: LayoutDesignerGridService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutToolbarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
