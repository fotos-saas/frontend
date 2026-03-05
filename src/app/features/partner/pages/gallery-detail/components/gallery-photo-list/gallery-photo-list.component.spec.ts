import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GalleryPhotoListComponent } from './gallery-photo-list.component';

describe('GalleryPhotoListComponent', () => {
  let component: GalleryPhotoListComponent;
  let fixture: ComponentFixture<GalleryPhotoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryPhotoListComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GalleryPhotoListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
