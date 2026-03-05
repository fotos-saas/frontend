import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerTeacherListComponent } from './teacher-list.component';
import { TeacherListStateService } from './teacher-list-state.service';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('PartnerTeacherListComponent', () => {
  let component: PartnerTeacherListComponent;
  let fixture: ComponentFixture<PartnerTeacherListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerTeacherListComponent],
      providers: [
        { provide: PartnerTeacherService, useValue: { getClassYears: vi.fn().mockReturnValue(of([])), getTeachers: vi.fn().mockReturnValue(of([])), getAllTeachers: vi.fn().mockReturnValue(of([])) } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PartnerTeacherListComponent, {
      set: { providers: [] }
    })
    .compileComponents();

    TestBed.overrideProvider(TeacherListStateService, {
      useValue: {
        teachers: vi.fn().mockReturnValue([]),
        filteredTeachers: vi.fn().mockReturnValue([]),
        isLoading: vi.fn().mockReturnValue(false),
        searchQuery: { set: vi.fn() },
        selectedClassYear: { set: vi.fn() },
        classYears: vi.fn().mockReturnValue([]),
        totalCount: vi.fn().mockReturnValue(0),
        loadTeachers: vi.fn(),
      }
    });

    fixture = TestBed.createComponent(PartnerTeacherListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
