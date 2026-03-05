import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ForumDetailComponent } from './forum-detail.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ForumDetailStateService } from './forum-detail-state.service';
import { LightboxService } from '../../../core/services/lightbox.service';
import { of } from 'rxjs';

describe('ForumDetailComponent', () => {
  let component: ForumDetailComponent;
  let fixture: ComponentFixture<ForumDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForumDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: ForumDetailStateService, useValue: {} },
        { provide: LightboxService, useValue: { registerCleanup: vi.fn(), open: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ForumDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
