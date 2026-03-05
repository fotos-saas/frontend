import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ClientPrepaymentComponent } from './client-prepayment.component';
import { ActivatedRoute } from '@angular/router';
import { PrepaymentPublicService } from './prepayment-public.service';
import { of } from 'rxjs';

describe('ClientPrepaymentComponent', () => {
  let component: ClientPrepaymentComponent;
  let fixture: ComponentFixture<ClientPrepaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientPrepaymentComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: PrepaymentPublicService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientPrepaymentComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
