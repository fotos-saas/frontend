import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WebshopOrdersComponent } from './webshop-orders.component';
import { PartnerWebshopService } from '../../../services/partner-webshop.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('WebshopOrdersComponent', () => {
  let component: WebshopOrdersComponent;
  let fixture: ComponentFixture<WebshopOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebshopOrdersComponent],
      providers: [
        { provide: PartnerWebshopService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WebshopOrdersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
