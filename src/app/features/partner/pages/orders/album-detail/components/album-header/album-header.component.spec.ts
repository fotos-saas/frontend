import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AlbumHeaderComponent } from './album-header.component';
import { PartnerOrdersService } from '../../../../../services/partner-orders.service';

describe('AlbumHeaderComponent', () => {
  let component: AlbumHeaderComponent;
  let fixture: ComponentFixture<AlbumHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlbumHeaderComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
        { provide: PartnerOrdersService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AlbumHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
