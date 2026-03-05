import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WebshopProductsComponent } from './webshop-products.component';
import { PartnerWebshopService } from '../../../services/partner-webshop.service';

describe('WebshopProductsComponent', () => {
  let component: WebshopProductsComponent;
  let fixture: ComponentFixture<WebshopProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebshopProductsComponent],
      providers: [
        { provide: PartnerWebshopService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WebshopProductsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
