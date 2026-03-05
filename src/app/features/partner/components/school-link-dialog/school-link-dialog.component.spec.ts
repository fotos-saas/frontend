import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SchoolLinkDialogComponent } from './school-link-dialog.component';
import { PartnerSchoolService } from '../../services/partner-school.service';

describe('SchoolLinkDialogComponent', () => {
  let component: SchoolLinkDialogComponent;
  let fixture: ComponentFixture<SchoolLinkDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolLinkDialogComponent],
      providers: [
        { provide: PartnerSchoolService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolLinkDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
