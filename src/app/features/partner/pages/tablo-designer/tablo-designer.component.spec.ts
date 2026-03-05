import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TabloDesignerComponent } from './tablo-designer.component';
import { PhotoshopService } from '../../services/photoshop.service';
import { PartnerService } from '../../services/partner.service';

describe('TabloDesignerComponent', () => {
  let component: TabloDesignerComponent;
  let fixture: ComponentFixture<TabloDesignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabloDesignerComponent],
      providers: [
        { provide: PhotoshopService, useValue: {} },
        { provide: PartnerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TabloDesignerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
