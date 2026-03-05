import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DetailScreenshotsComponent } from './detail-screenshots.component';

describe('DetailScreenshotsComponent', () => {
  let component: DetailScreenshotsComponent;
  let fixture: ComponentFixture<DetailScreenshotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailScreenshotsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailScreenshotsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
