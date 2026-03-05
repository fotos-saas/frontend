import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReviewSearchBoxComponent } from './search-box.component';

describe('ReviewSearchBoxComponent', () => {
  let component: ReviewSearchBoxComponent;
  let fixture: ComponentFixture<ReviewSearchBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewSearchBoxComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewSearchBoxComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
