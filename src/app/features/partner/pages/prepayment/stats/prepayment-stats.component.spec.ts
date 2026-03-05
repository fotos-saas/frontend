import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PrepaymentStatsComponent } from './prepayment-stats.component';
import { PartnerPrepaymentService } from '../../../services/partner-prepayment.service';
import { PartnerProjectService } from '../../../services/partner-project.service';

describe('PrepaymentStatsComponent', () => {
  let component: PrepaymentStatsComponent;
  let fixture: ComponentFixture<PrepaymentStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrepaymentStatsComponent],
      providers: [
        { provide: PartnerPrepaymentService, useValue: {} },
        { provide: PartnerProjectService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PrepaymentStatsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
