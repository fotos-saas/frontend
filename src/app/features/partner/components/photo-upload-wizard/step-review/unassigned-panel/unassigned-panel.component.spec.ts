import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReviewUnassignedPanelComponent } from './unassigned-panel.component';

describe('ReviewUnassignedPanelComponent', () => {
  let component: ReviewUnassignedPanelComponent;
  let fixture: ComponentFixture<ReviewUnassignedPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewUnassignedPanelComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewUnassignedPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
