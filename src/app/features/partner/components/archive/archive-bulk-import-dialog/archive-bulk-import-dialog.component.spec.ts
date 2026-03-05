import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ArchiveBulkImportDialogComponent } from './archive-bulk-import-dialog.component';
import { ARCHIVE_SERVICE } from '../../../models/archive.models';

describe('ArchiveBulkImportDialogComponent', () => {
  let component: ArchiveBulkImportDialogComponent;
  let fixture: ComponentFixture<ArchiveBulkImportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveBulkImportDialogComponent],
      providers: [
        { provide: ARCHIVE_SERVICE, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ArchiveBulkImportDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
