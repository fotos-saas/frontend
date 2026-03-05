import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MarketplacePageComponent } from './marketplace-page.component';
import { MarketplaceService } from '../../../services/marketplace.service';

describe('MarketplacePageComponent', () => {
  let component: MarketplacePageComponent;
  let fixture: ComponentFixture<MarketplacePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketplacePageComponent],
      providers: [
        { provide: MarketplaceService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MarketplacePageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
