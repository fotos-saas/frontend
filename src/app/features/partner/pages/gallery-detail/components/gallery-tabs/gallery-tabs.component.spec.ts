import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GalleryTabsComponent } from './gallery-tabs.component';

describe('GalleryTabsComponent', () => {
  let component: GalleryTabsComponent;
  let fixture: ComponentFixture<GalleryTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryTabsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GalleryTabsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
