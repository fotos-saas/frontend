import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectEditModalComponent } from './project-edit-modal.component';
import { PartnerService } from '../../services/partner.service';

describe('ProjectEditModalComponent', () => {
  let component: ProjectEditModalComponent;
  let fixture: ComponentFixture<ProjectEditModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectEditModalComponent],
      providers: [
        { provide: PartnerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectEditModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
