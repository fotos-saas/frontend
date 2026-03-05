import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectTagManagerComponent } from './project-tag-manager.component';
import { PartnerTagService } from '../../services/partner-tag.service';

describe('ProjectTagManagerComponent', () => {
  let component: ProjectTagManagerComponent;
  let fixture: ComponentFixture<ProjectTagManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTagManagerComponent],
      providers: [
        { provide: PartnerTagService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectTagManagerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
