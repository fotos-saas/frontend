import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CreateChargeDialogComponent } from './create-charge-dialog.component';
import { PartnerBillingService } from '../../services/partner-billing.service';
import { PartnerProjectService } from '../../services/partner-project.service';
import { PartnerServiceCatalogService } from '../../services/partner-service-catalog.service';

describe('CreateChargeDialogComponent', () => {
  let component: CreateChargeDialogComponent;
  let fixture: ComponentFixture<CreateChargeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateChargeDialogComponent],
      providers: [
        { provide: PartnerBillingService, useValue: {} },
        { provide: PartnerProjectService, useValue: {} },
        { provide: PartnerServiceCatalogService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateChargeDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
