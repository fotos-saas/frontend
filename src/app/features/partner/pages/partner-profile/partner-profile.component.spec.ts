import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerProfileComponent } from './partner-profile.component';
import { FormBuilder } from '@angular/forms';
import { PartnerProfileService } from '../../services/partner-profile.service';
import { AuthService } from '@core/services/auth.service';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

describe('PartnerProfileComponent', () => {
  let component: PartnerProfileComponent;
  let fixture: ComponentFixture<PartnerProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerProfileComponent, ReactiveFormsModule],
      providers: [
        { provide: FormBuilder, useValue: new FormBuilder() },
        { provide: PartnerProfileService, useValue: {} },
        { provide: AuthService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerProfileComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
