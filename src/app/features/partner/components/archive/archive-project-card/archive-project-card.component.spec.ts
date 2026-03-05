import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ArchiveProjectCardComponent } from './archive-project-card.component';

describe('ArchiveProjectCardComponent', () => {
  let component: ArchiveProjectCardComponent;
  let fixture: ComponentFixture<ArchiveProjectCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveProjectCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ArchiveProjectCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
