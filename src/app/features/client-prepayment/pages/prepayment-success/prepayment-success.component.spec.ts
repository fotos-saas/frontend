import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PrepaymentSuccessComponent } from './prepayment-success.component';
import { ActivatedRoute } from '@angular/router';
import { PrepaymentPublicService } from '../../prepayment-public.service';
import { of } from 'rxjs';

describe('PrepaymentSuccessComponent', () => {
  let component: PrepaymentSuccessComponent;
  let fixture: ComponentFixture<PrepaymentSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrepaymentSuccessComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: PrepaymentPublicService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PrepaymentSuccessComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
