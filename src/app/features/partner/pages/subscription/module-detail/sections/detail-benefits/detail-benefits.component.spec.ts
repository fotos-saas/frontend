import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DetailBenefitsComponent } from './detail-benefits.component';

describe('DetailBenefitsComponent', () => {
  let component: DetailBenefitsComponent;
  let fixture: ComponentFixture<DetailBenefitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailBenefitsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailBenefitsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
