import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ClientRegisterDialogComponent } from './client-register-dialog.component';
import { ClientRegisterFormService } from './client-register-form.service';

describe('ClientRegisterDialogComponent', () => {
  let component: ClientRegisterDialogComponent;
  let fixture: ComponentFixture<ClientRegisterDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientRegisterDialogComponent],
      providers: [
        { provide: ClientRegisterFormService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientRegisterDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
