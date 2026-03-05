import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReviewFilterTabsComponent } from './filter-tabs.component';

describe('ReviewFilterTabsComponent', () => {
  let component: ReviewFilterTabsComponent;
  let fixture: ComponentFixture<ReviewFilterTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewFilterTabsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewFilterTabsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
