import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ArchiveBulkPhotoUploadComponent } from './archive-bulk-photo-upload.component';
import { ARCHIVE_SERVICE } from '../../../models/archive.models';

describe('ArchiveBulkPhotoUploadComponent', () => {
  let component: ArchiveBulkPhotoUploadComponent;
  let fixture: ComponentFixture<ArchiveBulkPhotoUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveBulkPhotoUploadComponent],
      providers: [
        { provide: ARCHIVE_SERVICE, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ArchiveBulkPhotoUploadComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
