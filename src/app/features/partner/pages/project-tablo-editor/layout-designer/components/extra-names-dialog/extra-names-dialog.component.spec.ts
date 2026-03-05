import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ExtraNamesDialogComponent } from './extra-names-dialog.component';

describe('ExtraNamesDialogComponent', () => {
  let component: ExtraNamesDialogComponent;
  let fixture: ComponentFixture<ExtraNamesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtraNamesDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtraNamesDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
