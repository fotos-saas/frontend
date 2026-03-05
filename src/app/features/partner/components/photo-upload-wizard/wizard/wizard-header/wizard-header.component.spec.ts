import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WizardHeaderComponent } from './wizard-header.component';

describe('WizardHeaderComponent', () => {
  let component: WizardHeaderComponent;
  let fixture: ComponentFixture<WizardHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WizardHeaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WizardHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
