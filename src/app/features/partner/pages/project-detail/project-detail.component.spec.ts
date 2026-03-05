import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerProjectDetailComponent } from './project-detail.component';

describe('PartnerProjectDetailComponent', () => {
  let component: PartnerProjectDetailComponent;
  let fixture: ComponentFixture<PartnerProjectDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerProjectDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerProjectDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
