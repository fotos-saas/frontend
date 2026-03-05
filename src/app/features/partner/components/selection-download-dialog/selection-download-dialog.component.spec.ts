import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SelectionDownloadDialogComponent } from './selection-download-dialog.component';

describe('SelectionDownloadDialogComponent', () => {
  let component: SelectionDownloadDialogComponent;
  let fixture: ComponentFixture<SelectionDownloadDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionDownloadDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectionDownloadDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
