import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StorageUsageCardComponent } from './storage-usage-card.component';

describe('StorageUsageCardComponent', () => {
  let component: StorageUsageCardComponent;
  let fixture: ComponentFixture<StorageUsageCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageUsageCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(StorageUsageCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
