import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { OverrideDialogComponent } from './override-dialog.component';

describe('OverrideDialogComponent', () => {
  let component: OverrideDialogComponent;
  let fixture: ComponentFixture<OverrideDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverrideDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(OverrideDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
