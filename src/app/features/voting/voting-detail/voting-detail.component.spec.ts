import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { VotingDetailComponent } from './voting-detail.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { VotingService } from '../../../core/services/voting.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';
import { of } from 'rxjs';

describe('VotingDetailComponent', () => {
  let component: VotingDetailComponent;
  let fixture: ComponentFixture<VotingDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VotingDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: VotingService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: GuestService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(VotingDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
