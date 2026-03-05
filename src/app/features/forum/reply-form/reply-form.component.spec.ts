import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReplyFormComponent } from './reply-form.component';

describe('ReplyFormComponent', () => {
  let component: ReplyFormComponent;
  let fixture: ComponentFixture<ReplyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReplyFormComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ReplyFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
