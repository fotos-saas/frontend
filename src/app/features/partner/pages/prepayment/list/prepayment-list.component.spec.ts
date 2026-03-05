import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PrepaymentListComponent } from './prepayment-list.component';
import { PartnerPrepaymentService } from '../../../services/partner-prepayment.service';

describe('PrepaymentListComponent', () => {
  let component: PrepaymentListComponent;
  let fixture: ComponentFixture<PrepaymentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrepaymentListComponent],
      providers: [
        { provide: PartnerPrepaymentService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PrepaymentListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
