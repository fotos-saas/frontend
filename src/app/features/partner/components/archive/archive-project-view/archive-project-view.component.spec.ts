import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ArchiveProjectViewComponent } from './archive-project-view.component';
import { ARCHIVE_SERVICE } from '../../../models/archive.models';

describe('ArchiveProjectViewComponent', () => {
  let component: ArchiveProjectViewComponent;
  let fixture: ComponentFixture<ArchiveProjectViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveProjectViewComponent],
      providers: [
        { provide: ARCHIVE_SERVICE, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ArchiveProjectViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
