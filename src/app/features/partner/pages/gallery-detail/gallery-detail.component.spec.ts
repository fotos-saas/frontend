import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GalleryDetailComponent } from './gallery-detail.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { GalleryDetailActionsService } from './gallery-detail-actions.service';
import { of } from 'rxjs';

describe('GalleryDetailComponent', () => {
  let component: GalleryDetailComponent;
  let fixture: ComponentFixture<GalleryDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: Location, useValue: {} },
        { provide: GalleryDetailActionsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GalleryDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
