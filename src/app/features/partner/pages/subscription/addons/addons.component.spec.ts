import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AddonsComponent } from './addons.component';
import { AddonService } from '../../../services/addon.service';
import { SubscriptionService } from '../../../services/subscription.service';
import { StorageService } from '../../../services/storage.service';
import { LoggerService } from '../../../../../core/services/logger.service';
import { ToastService } from '../../../../../core/services/toast.service';

describe('AddonsComponent', () => {
  let component: AddonsComponent;
  let fixture: ComponentFixture<AddonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddonsComponent],
      providers: [
        { provide: AddonService, useValue: {} },
        { provide: SubscriptionService, useValue: {} },
        { provide: StorageService, useValue: {} },
        { provide: LoggerService, useValue: {} },
        { provide: ToastService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AddonsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
