import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CreateDiscussionDialogComponent } from './create-discussion-dialog.component';
import { ForumService } from '../../../core/services/forum.service';
import { DiscussionFormValidatorService } from './discussion-form-validator.service';

describe('CreateDiscussionDialogComponent', () => {
  let component: CreateDiscussionDialogComponent;
  let fixture: ComponentFixture<CreateDiscussionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateDiscussionDialogComponent],
      providers: [
        { provide: ForumService, useValue: {} },
        { provide: DiscussionFormValidatorService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateDiscussionDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
