import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DetailFaqComponent } from './detail-faq.component';

describe('DetailFaqComponent', () => {
  let component: DetailFaqComponent;
  let fixture: ComponentFixture<DetailFaqComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailFaqComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailFaqComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
