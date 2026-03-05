import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ArchivePhotoUploadComponent } from './archive-photo-upload.component';
import { ARCHIVE_SERVICE } from '../../../models/archive.models';

describe('ArchivePhotoUploadComponent', () => {
  let component: ArchivePhotoUploadComponent;
  let fixture: ComponentFixture<ArchivePhotoUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivePhotoUploadComponent],
      providers: [
        { provide: ARCHIVE_SERVICE, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ArchivePhotoUploadComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
