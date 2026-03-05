import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DiscountDialogComponent } from './discount-dialog.component';
import { SuperAdminService } from '../../services/super-admin.service';

describe('DiscountDialogComponent', () => {
  let component: DiscountDialogComponent;
  let fixture: ComponentFixture<DiscountDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscountDialogComponent],
      providers: [
        { provide: SuperAdminService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscountDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
