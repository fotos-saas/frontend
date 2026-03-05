import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { VotingEditDialogComponent } from './voting-edit-dialog.component';

describe('VotingEditDialogComponent', () => {
  let component: VotingEditDialogComponent;
  let fixture: ComponentFixture<VotingEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VotingEditDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(VotingEditDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
