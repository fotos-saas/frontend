import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StoragePurchaseDialogComponent } from './storage-purchase-dialog.component';

describe('StoragePurchaseDialogComponent', () => {
  let component: StoragePurchaseDialogComponent;
  let fixture: ComponentFixture<StoragePurchaseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoragePurchaseDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(StoragePurchaseDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
