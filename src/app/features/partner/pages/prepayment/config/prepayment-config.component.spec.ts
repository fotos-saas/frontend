import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PrepaymentConfigComponent } from './prepayment-config.component';
import { PartnerPrepaymentService } from '../../../services/partner-prepayment.service';

describe('PrepaymentConfigComponent', () => {
  let component: PrepaymentConfigComponent;
  let fixture: ComponentFixture<PrepaymentConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrepaymentConfigComponent],
      providers: [
        { provide: PartnerPrepaymentService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PrepaymentConfigComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
