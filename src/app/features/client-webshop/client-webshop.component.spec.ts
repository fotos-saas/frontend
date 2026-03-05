import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ClientWebshopComponent } from './client-webshop.component';
import { ActivatedRoute } from '@angular/router';
import { ClientWebshopService } from './client-webshop.service';
import { of } from 'rxjs';

describe('ClientWebshopComponent', () => {
  let component: ClientWebshopComponent;
  let fixture: ComponentFixture<ClientWebshopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientWebshopComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: ClientWebshopService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientWebshopComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
