import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LayoutFloatingToolbarComponent } from './layout-floating-toolbar.component';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutDesignerActionsService } from '../../layout-designer-actions.service';

describe('LayoutFloatingToolbarComponent', () => {
  let component: LayoutFloatingToolbarComponent;
  let fixture: ComponentFixture<LayoutFloatingToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutFloatingToolbarComponent],
      providers: [
        { provide: LayoutDesignerStateService, useValue: {} },
        { provide: LayoutDesignerActionsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutFloatingToolbarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
