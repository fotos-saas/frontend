import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { QuoteListComponent } from './quote-list.component';
import { QuoteListActionsService } from './quote-list-actions.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('QuoteListComponent', () => {
  let component: QuoteListComponent;
  let fixture: ComponentFixture<QuoteListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteListComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
        { provide: QuoteListActionsService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(QuoteListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
