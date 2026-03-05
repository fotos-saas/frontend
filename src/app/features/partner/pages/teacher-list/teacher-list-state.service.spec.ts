import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TeacherListStateService } from './teacher-list-state.service';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { PartnerSchoolService } from '../../services/partner-school.service';

describe('TeacherListStateService', () => {
  let service: TeacherListStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TeacherListStateService,
        { provide: PartnerTeacherService, useValue: { getTeachers: vi.fn(), getClassYears: vi.fn(() => of([])) } },
        { provide: PartnerSchoolService, useValue: { getAllSchools: vi.fn(() => of([])) } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} }, queryParamMap: of(new Map()) } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(TeacherListStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.teachers()).toEqual([]);
    expect(service.totalPages()).toBe(1);
    expect(service.totalTeachers()).toBe(0);
    expect(service.syncingSchoolId()).toBe(0);
    expect(service.downloading()).toBe(false);
  });
});
