import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SnapshotRestoreDialogComponent } from './snapshot-restore-dialog.component';

describe('SnapshotRestoreDialogComponent', () => {
  let component: SnapshotRestoreDialogComponent;
  let fixture: ComponentFixture<SnapshotRestoreDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotRestoreDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SnapshotRestoreDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
