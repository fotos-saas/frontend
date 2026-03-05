import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WizardFooterComponent } from './wizard-footer.component';

describe('WizardFooterComponent', () => {
  let component: WizardFooterComponent;
  let fixture: ComponentFixture<WizardFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WizardFooterComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WizardFooterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
