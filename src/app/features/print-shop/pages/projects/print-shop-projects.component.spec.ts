import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PrintShopProjectsComponent } from './print-shop-projects.component';

describe('PrintShopProjectsComponent', () => {
  let component: PrintShopProjectsComponent;
  let fixture: ComponentFixture<PrintShopProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintShopProjectsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PrintShopProjectsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
