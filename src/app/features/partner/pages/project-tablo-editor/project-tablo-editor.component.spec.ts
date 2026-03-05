import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectTabloEditorComponent } from './project-tablo-editor.component';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { PartnerService } from '../../services/partner.service';
import { PartnerFinalizationService } from '../../services/partner-finalization.service';
import { PhotoshopService } from '../../services/photoshop.service';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';
import { TabloEditorTemplateService } from './tablo-editor-template.service';
import { TabloEditorActionsService } from './tablo-editor-actions.service';
import { of } from 'rxjs';

describe('ProjectTabloEditorComponent', () => {
  let component: ProjectTabloEditorComponent;
  let fixture: ComponentFixture<ProjectTabloEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTabloEditorComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Location, useValue: {} },
        { provide: PartnerService, useValue: {} },
        { provide: PartnerFinalizationService, useValue: {} },
        { provide: PhotoshopService, useValue: {} },
        { provide: TabloEditorSnapshotService, useValue: {} },
        { provide: TabloEditorTemplateService, useValue: {} },
        { provide: TabloEditorActionsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectTabloEditorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
