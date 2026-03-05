import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { VotingResultsComponent } from './voting-results.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { VotingService } from '../../../core/services/voting.service';
import { of } from 'rxjs';

describe('VotingResultsComponent', () => {
  let component: VotingResultsComponent;
  let fixture: ComponentFixture<VotingResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VotingResultsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: VotingService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(VotingResultsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
