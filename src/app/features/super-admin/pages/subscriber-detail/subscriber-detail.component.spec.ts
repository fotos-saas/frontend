import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SubscriberDetailComponent } from './subscriber-detail.component';
import { SubscriberDetailStateService } from './subscriber-detail-state.service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('SubscriberDetailComponent', () => {
  let component: SubscriberDetailComponent;
  let fixture: ComponentFixture<SubscriberDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriberDetailComponent],
      providers: [
        { provide: SubscriberDetailStateService, useValue: {} },
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriberDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
