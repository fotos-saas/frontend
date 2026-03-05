import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MarketplaceUsagePageComponent } from './marketplace-usage-page.component';
import { MarketplaceService } from '../../../services/marketplace.service';

describe('MarketplaceUsagePageComponent', () => {
  let component: MarketplaceUsagePageComponent;
  let fixture: ComponentFixture<MarketplaceUsagePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketplaceUsagePageComponent],
      providers: [
        { provide: MarketplaceService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MarketplaceUsagePageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
