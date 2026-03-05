import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GalleryHeaderComponent } from './gallery-header.component';

describe('GalleryHeaderComponent', () => {
  let component: GalleryHeaderComponent;
  let fixture: ComponentFixture<GalleryHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryHeaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GalleryHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
