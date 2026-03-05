import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ForumCardComponent } from './forum-card.component';

describe('ForumCardComponent', () => {
  let component: ForumCardComponent;
  let fixture: ComponentFixture<ForumCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForumCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ForumCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
