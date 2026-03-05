import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ForumSearchComponent } from './forum-search.component';

describe('ForumSearchComponent', () => {
  let component: ForumSearchComponent;
  let fixture: ComponentFixture<ForumSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForumSearchComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ForumSearchComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
