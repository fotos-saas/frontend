import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AlbumPhotoListComponent } from './album-photo-list.component';

describe('AlbumPhotoListComponent', () => {
  let component: AlbumPhotoListComponent;
  let fixture: ComponentFixture<AlbumPhotoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlbumPhotoListComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AlbumPhotoListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
