import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UploadToEveryoneFormComponent } from './upload-to-everyone-form.component';

describe('UploadToEveryoneFormComponent', () => {
  let component: UploadToEveryoneFormComponent;
  let fixture: ComponentFixture<UploadToEveryoneFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadToEveryoneFormComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadToEveryoneFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
