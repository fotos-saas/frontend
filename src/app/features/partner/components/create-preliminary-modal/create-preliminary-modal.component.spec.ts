import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CreatePreliminaryModalComponent } from './create-preliminary-modal.component';
import { PartnerPreliminaryService } from '../../services/partner-preliminary.service';
import { PartnerService } from '../../services/partner.service';

describe('CreatePreliminaryModalComponent', () => {
  let component: CreatePreliminaryModalComponent;
  let fixture: ComponentFixture<CreatePreliminaryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePreliminaryModalComponent],
      providers: [
        { provide: PartnerPreliminaryService, useValue: {} },
        { provide: PartnerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CreatePreliminaryModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
