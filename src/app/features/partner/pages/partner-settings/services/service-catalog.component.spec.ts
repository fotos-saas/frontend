import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ServiceCatalogComponent } from './service-catalog.component';
import { PartnerServiceCatalogService } from '../../../services/partner-service-catalog.service';

describe('ServiceCatalogComponent', () => {
  let component: ServiceCatalogComponent;
  let fixture: ComponentFixture<ServiceCatalogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceCatalogComponent],
      providers: [
        { provide: PartnerServiceCatalogService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceCatalogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
