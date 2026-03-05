import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SelectionGridComponent } from './selection-grid.component';
import { SelectionGridStateService } from './selection-grid-state.service';

describe('SelectionGridComponent', () => {
  let component: SelectionGridComponent;
  let fixture: ComponentFixture<SelectionGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionGridComponent],
      providers: [
        { provide: SelectionGridStateService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectionGridComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
