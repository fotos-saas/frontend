import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ClientEditModalComponent } from './client-edit-modal.component';
import { PartnerOrdersService } from '../../services/partner-orders.service';

describe('ClientEditModalComponent', () => {
  let component: ClientEditModalComponent;
  let fixture: ComponentFixture<ClientEditModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientEditModalComponent],
      providers: [
        { provide: PartnerOrdersService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientEditModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
