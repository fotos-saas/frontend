import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MissingUserCardComponent } from './missing-user-card.component';

describe('MissingUserCardComponent', () => {
  let component: MissingUserCardComponent;
  let fixture: ComponentFixture<MissingUserCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissingUserCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MissingUserCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
