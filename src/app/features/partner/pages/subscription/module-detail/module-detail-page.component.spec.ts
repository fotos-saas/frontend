import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ModuleDetailPageComponent } from './module-detail-page.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { MarketplaceService } from '../../../services/marketplace.service';
import { of } from 'rxjs';

describe('ModuleDetailPageComponent', () => {
  let component: ModuleDetailPageComponent;
  let fixture: ComponentFixture<ModuleDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleDetailPageComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: MarketplaceService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ModuleDetailPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
