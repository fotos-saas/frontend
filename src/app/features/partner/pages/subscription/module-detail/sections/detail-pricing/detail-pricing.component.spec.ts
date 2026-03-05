import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DetailPricingComponent } from './detail-pricing.component';

describe('DetailPricingComponent', () => {
  let component: DetailPricingComponent;
  let fixture: ComponentFixture<DetailPricingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailPricingComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailPricingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
