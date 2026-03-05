import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WebshopOrderDetailComponent } from './webshop-order-detail.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { PartnerWebshopService } from '../../../services/partner-webshop.service';
import { of } from 'rxjs';

describe('WebshopOrderDetailComponent', () => {
  let component: WebshopOrderDetailComponent;
  let fixture: ComponentFixture<WebshopOrderDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebshopOrderDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: PartnerWebshopService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WebshopOrderDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
