import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CreatePostDialogComponent } from './create-post-dialog.component';
import { CreatePostDialogActionsService } from './create-post-dialog-actions.service';
import { PostFormValidatorService } from '../services/post-form-validator.service';

describe('CreatePostDialogComponent', () => {
  let component: CreatePostDialogComponent;
  let fixture: ComponentFixture<CreatePostDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePostDialogComponent],
      providers: [
        { provide: CreatePostDialogActionsService, useValue: {} },
        { provide: PostFormValidatorService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CreatePostDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
