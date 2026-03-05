import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ClientWelcomeComponent } from './welcome.component';
import { ClientService } from '../../services/client.service';

describe('ClientWelcomeComponent', () => {
  let component: ClientWelcomeComponent;
  let fixture: ComponentFixture<ClientWelcomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientWelcomeComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
        { provide: ClientService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientWelcomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
