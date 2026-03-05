import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectCardComponent } from './project-card.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ElectronService } from '../../../../core/services/electron.service';
import { PsdStatusService } from '../../services/psd-status.service';

describe('ProjectCardComponent', () => {
  let component: ProjectCardComponent;
  let fixture: ComponentFixture<ProjectCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardComponent],
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: ElectronService, useValue: {} },
        { provide: PsdStatusService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
