import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerProjectCreateComponent } from './project-create.component';

describe('PartnerProjectCreateComponent', () => {
  let component: PartnerProjectCreateComponent;
  let fixture: ComponentFixture<PartnerProjectCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerProjectCreateComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerProjectCreateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
