import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BrandingComponent } from './branding.component';
import { BrandingService } from '../../../services/branding.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { LoggerService } from '../../../../../core/services/logger.service';

describe('BrandingComponent', () => {
  let component: BrandingComponent;
  let fixture: ComponentFixture<BrandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandingComponent],
      providers: [
        { provide: BrandingService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: ToastService, useValue: {} },
        { provide: LoggerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BrandingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
