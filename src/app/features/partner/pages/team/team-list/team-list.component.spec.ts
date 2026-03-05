import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerTeamListComponent } from './team-list.component';
import { TeamService } from '../../../services/team.service';
import { DevLoginService } from '../../../../../core/services/dev-login.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ClipboardService } from '../../../../../core/services/clipboard.service';

describe('PartnerTeamListComponent', () => {
  let component: PartnerTeamListComponent;
  let fixture: ComponentFixture<PartnerTeamListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerTeamListComponent],
      providers: [
        { provide: TeamService, useValue: {} },
        { provide: DevLoginService, useValue: { isDevMode: () => false } },
        { provide: ToastService, useValue: {} },
        { provide: ClipboardService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerTeamListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
