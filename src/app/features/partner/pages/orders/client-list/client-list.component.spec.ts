import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerClientListComponent } from './client-list.component';
import { PartnerOrdersService } from '../../../services/partner-orders.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('PartnerClientListComponent', () => {
  let component: PartnerClientListComponent;
  let fixture: ComponentFixture<PartnerClientListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerClientListComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
        { provide: PartnerOrdersService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerClientListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
