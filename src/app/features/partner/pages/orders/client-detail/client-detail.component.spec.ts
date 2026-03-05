import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerClientDetailComponent } from './client-detail.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../core/services/toast.service';
import { ClipboardService } from '../../../../../core/services/clipboard.service';
import { ClientDetailActionsService } from './client-detail-actions.service';
import { of } from 'rxjs';

describe('PartnerClientDetailComponent', () => {
  let component: PartnerClientDetailComponent;
  let fixture: ComponentFixture<PartnerClientDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerClientDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: ToastService, useValue: {} },
        { provide: ClipboardService, useValue: {} },
        { provide: ClientDetailActionsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerClientDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
