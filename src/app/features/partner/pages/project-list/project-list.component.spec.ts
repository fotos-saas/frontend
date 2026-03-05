import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerProjectListComponent } from './project-list.component';
import { LoggerService } from '@core/services/logger.service';
import { PartnerService } from '../../services/partner.service';
import { PartnerTagService } from '../../services/partner-tag.service';
import { PsdStatusService } from '../../services/psd-status.service';
import { ElectronService } from '../../../../core/services/electron.service';
import { AuthService } from '@core/services/auth.service';
import { ProjectListActionsService } from './project-list-actions.service';

describe('PartnerProjectListComponent', () => {
  let component: PartnerProjectListComponent;
  let fixture: ComponentFixture<PartnerProjectListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerProjectListComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
        { provide: LoggerService, useValue: {} },
        { provide: PartnerService, useValue: {} },
        { provide: PartnerTagService, useValue: {} },
        { provide: PsdStatusService, useValue: {} },
        { provide: ElectronService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: ProjectListActionsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerProjectListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
