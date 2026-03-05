import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WebshopSettingsComponent } from './webshop-settings.component';
import { PartnerWebshopService } from '../../../services/partner-webshop.service';

describe('WebshopSettingsComponent', () => {
  let component: WebshopSettingsComponent;
  let fixture: ComponentFixture<WebshopSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebshopSettingsComponent],
      providers: [
        { provide: PartnerWebshopService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WebshopSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
