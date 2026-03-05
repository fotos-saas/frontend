import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ModalPersonCardComponent } from './modal-person-card.component';

describe('ModalPersonCardComponent', () => {
  let component: ModalPersonCardComponent;
  let fixture: ComponentFixture<ModalPersonCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalPersonCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalPersonCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
