import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AddonsCardComponent } from './addons-card.component';
import { AddonService } from '../../../../services/addon.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { LoggerService } from '../../../../../../core/services/logger.service';

describe('AddonsCardComponent', () => {
  let component: AddonsCardComponent;
  let fixture: ComponentFixture<AddonsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddonsCardComponent],
      providers: [
        { provide: AddonService, useValue: {} },
        { provide: ToastService, useValue: {} },
        { provide: LoggerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AddonsCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
