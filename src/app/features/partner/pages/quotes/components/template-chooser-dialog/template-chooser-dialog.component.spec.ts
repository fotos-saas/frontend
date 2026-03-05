import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TemplateChooserDialogComponent } from './template-chooser-dialog.component';

describe('TemplateChooserDialogComponent', () => {
  let component: TemplateChooserDialogComponent;
  let fixture: ComponentFixture<TemplateChooserDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateChooserDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateChooserDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
