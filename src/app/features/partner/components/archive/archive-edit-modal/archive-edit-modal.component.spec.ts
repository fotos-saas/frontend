import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ArchiveEditModalComponent } from './archive-edit-modal.component';
import { ARCHIVE_SERVICE } from '../../../models/archive.models';

describe('ArchiveEditModalComponent', () => {
  let component: ArchiveEditModalComponent;
  let fixture: ComponentFixture<ArchiveEditModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveEditModalComponent],
      providers: [
        { provide: ARCHIVE_SERVICE, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ArchiveEditModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
