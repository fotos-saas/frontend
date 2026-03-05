import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PhotoLightboxComponent } from './photo-lightbox.component';
import { PartnerAlbumService } from '../../../services/partner-album.service';
import { PartnerProjectService } from '../../../services/partner-project.service';

describe('PhotoLightboxComponent', () => {
  let component: PhotoLightboxComponent;
  let fixture: ComponentFixture<PhotoLightboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoLightboxComponent],
      providers: [
        { provide: PartnerAlbumService, useValue: {} },
        { provide: PartnerProjectService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoLightboxComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
