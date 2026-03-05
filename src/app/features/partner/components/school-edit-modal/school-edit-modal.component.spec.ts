import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SchoolEditModalComponent } from './school-edit-modal.component';
import { PartnerService } from '../../services/partner.service';

describe('SchoolEditModalComponent', () => {
  let component: SchoolEditModalComponent;
  let fixture: ComponentFixture<SchoolEditModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolEditModalComponent],
      providers: [
        { provide: PartnerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolEditModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
