import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TemplateSaveDialogComponent } from './template-save-dialog.component';

describe('TemplateSaveDialogComponent', () => {
  let component: TemplateSaveDialogComponent;
  let fixture: ComponentFixture<TemplateSaveDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateSaveDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateSaveDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
