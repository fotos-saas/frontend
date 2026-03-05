import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DetailHowItWorksComponent } from './detail-how-it-works.component';

describe('DetailHowItWorksComponent', () => {
  let component: DetailHowItWorksComponent;
  let fixture: ComponentFixture<DetailHowItWorksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailHowItWorksComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailHowItWorksComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
