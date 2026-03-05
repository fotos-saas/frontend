import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PersonsModalComponent } from './persons-modal.component';
import { PartnerService } from '../../../services/partner.service';
import { PartnerProjectService } from '../../../services/partner-project.service';
import { ElectronService } from '../../../../../core/services/electron.service';
import { BatchPortraitActionsService } from '../batch-portrait-dialog/batch-portrait-actions.service';
import { PersonsModalActionsService } from '../persons-modal-actions.service';

describe('PersonsModalComponent', () => {
  let component: PersonsModalComponent;
  let fixture: ComponentFixture<PersonsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonsModalComponent],
      providers: [
        { provide: PartnerService, useValue: {} },
        { provide: PartnerProjectService, useValue: {} },
        { provide: ElectronService, useValue: {} },
        { provide: BatchPortraitActionsService, useValue: {} },
        { provide: PersonsModalActionsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonsModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
