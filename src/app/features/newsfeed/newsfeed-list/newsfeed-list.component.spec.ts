import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NewsfeedListComponent } from './newsfeed-list.component';
import { NewsfeedListStateService } from './newsfeed-list-state.service';

describe('NewsfeedListComponent', () => {
  let component: NewsfeedListComponent;
  let fixture: ComponentFixture<NewsfeedListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsfeedListComponent],
      providers: [
        { provide: NewsfeedListStateService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsfeedListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
