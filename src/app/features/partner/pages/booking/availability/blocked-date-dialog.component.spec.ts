import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BlockedDateDialogComponent } from './blocked-date-dialog.component';

describe('BlockedDateDialogComponent', () => {
  let component: BlockedDateDialogComponent;
  let fixture: ComponentFixture<BlockedDateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlockedDateDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BlockedDateDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
