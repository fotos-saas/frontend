import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HelpFabComponent } from './help-fab.component';

describe('HelpFabComponent', () => {
  let component: HelpFabComponent;
  let fixture: ComponentFixture<HelpFabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpFabComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpFabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
