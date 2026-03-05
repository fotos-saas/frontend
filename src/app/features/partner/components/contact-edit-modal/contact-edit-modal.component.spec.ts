import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ContactEditModalComponent } from './contact-edit-modal.component';
import { PartnerService } from '../../services/partner.service';

describe('ContactEditModalComponent', () => {
  let component: ContactEditModalComponent;
  let fixture: ComponentFixture<ContactEditModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactEditModalComponent],
      providers: [
        { provide: PartnerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactEditModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
