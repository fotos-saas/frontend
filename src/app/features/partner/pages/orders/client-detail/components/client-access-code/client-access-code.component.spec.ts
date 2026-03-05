import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ClientAccessCodeComponent } from './client-access-code.component';

describe('ClientAccessCodeComponent', () => {
  let component: ClientAccessCodeComponent;
  let fixture: ComponentFixture<ClientAccessCodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientAccessCodeComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientAccessCodeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
