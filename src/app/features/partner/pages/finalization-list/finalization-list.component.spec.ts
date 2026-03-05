import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FinalizationListComponent } from './finalization-list.component';
import { LoggerService } from '@core/services/logger.service';
import { ToastService } from '@core/services/toast.service';
import { PartnerFinalizationService } from '../../services/partner-finalization.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('FinalizationListComponent', () => {
  let component: FinalizationListComponent;
  let fixture: ComponentFixture<FinalizationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalizationListComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
        { provide: LoggerService, useValue: {} },
        { provide: ToastService, useValue: {} },
        { provide: PartnerFinalizationService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FinalizationListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
