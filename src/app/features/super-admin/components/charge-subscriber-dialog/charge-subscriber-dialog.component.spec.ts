import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ChargeSubscriberDialogComponent } from './charge-subscriber-dialog.component';
import { SuperAdminService } from '../../services/super-admin.service';

describe('ChargeSubscriberDialogComponent', () => {
  let component: ChargeSubscriberDialogComponent;
  let fixture: ComponentFixture<ChargeSubscriberDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargeSubscriberDialogComponent],
      providers: [
        { provide: SuperAdminService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ChargeSubscriberDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
