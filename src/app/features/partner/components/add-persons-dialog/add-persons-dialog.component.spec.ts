import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AddPersonsDialogComponent } from './add-persons-dialog.component';
import { PartnerProjectService } from '../../services/partner-project.service';

describe('AddPersonsDialogComponent', () => {
  let component: AddPersonsDialogComponent;
  let fixture: ComponentFixture<AddPersonsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPersonsDialogComponent],
      providers: [
        { provide: PartnerProjectService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AddPersonsDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
