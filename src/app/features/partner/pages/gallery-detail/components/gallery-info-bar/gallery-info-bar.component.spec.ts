import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GalleryInfoBarComponent } from './gallery-info-bar.component';

describe('GalleryInfoBarComponent', () => {
  let component: GalleryInfoBarComponent;
  let fixture: ComponentFixture<GalleryInfoBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryInfoBarComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GalleryInfoBarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
