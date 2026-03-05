import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LayoutPhotoUploadDialogComponent } from './layout-photo-upload-dialog.component';
import { PartnerAlbumService } from '../../../../../services/partner-album.service';
import { PartnerProjectService } from '../../../../../services/partner-project.service';

describe('LayoutPhotoUploadDialogComponent', () => {
  let component: LayoutPhotoUploadDialogComponent;
  let fixture: ComponentFixture<LayoutPhotoUploadDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutPhotoUploadDialogComponent],
      providers: [
        { provide: PartnerAlbumService, useValue: {} },
        { provide: PartnerProjectService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutPhotoUploadDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
