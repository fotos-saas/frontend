import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerAlbumDetailComponent } from './album-detail.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { AlbumDetailActionsService } from './album-detail-actions.service';
import { of } from 'rxjs';

describe('PartnerAlbumDetailComponent', () => {
  let component: PartnerAlbumDetailComponent;
  let fixture: ComponentFixture<PartnerAlbumDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerAlbumDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: AlbumDetailActionsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerAlbumDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
