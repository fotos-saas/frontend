import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ServiceEditDialogComponent } from './service-edit-dialog.component';
import { PartnerServiceCatalogService } from '../../../services/partner-service-catalog.service';

describe('ServiceEditDialogComponent', () => {
  let component: ServiceEditDialogComponent;
  let fixture: ComponentFixture<ServiceEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceEditDialogComponent],
      providers: [
        { provide: PartnerServiceCatalogService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceEditDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
