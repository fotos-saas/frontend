import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ArchiveDownloadDialogComponent } from './archive-download-dialog.component';

describe('ArchiveDownloadDialogComponent', () => {
  let component: ArchiveDownloadDialogComponent;
  let fixture: ComponentFixture<ArchiveDownloadDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveDownloadDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ArchiveDownloadDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
