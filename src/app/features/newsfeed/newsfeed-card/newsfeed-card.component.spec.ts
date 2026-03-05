import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NewsfeedCardComponent } from './newsfeed-card.component';
import { NewsfeedCardCommentService } from './newsfeed-card-comment.service';

describe('NewsfeedCardComponent', () => {
  let component: NewsfeedCardComponent;
  let fixture: ComponentFixture<NewsfeedCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsfeedCardComponent],
      providers: [
        { provide: NewsfeedCardCommentService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsfeedCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
