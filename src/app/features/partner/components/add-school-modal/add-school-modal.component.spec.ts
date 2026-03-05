import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AddSchoolModalComponent } from './add-school-modal.component';
import { PartnerService } from '../../services/partner.service';

describe('AddSchoolModalComponent', () => {
  let component: AddSchoolModalComponent;
  let fixture: ComponentFixture<AddSchoolModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSchoolModalComponent],
      providers: [
        { provide: PartnerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AddSchoolModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
