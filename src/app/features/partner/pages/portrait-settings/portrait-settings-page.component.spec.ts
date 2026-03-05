import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PortraitSettingsPageComponent } from './portrait-settings-page.component';

describe('PortraitSettingsPageComponent', () => {
  let component: PortraitSettingsPageComponent;
  let fixture: ComponentFixture<PortraitSettingsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortraitSettingsPageComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PortraitSettingsPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
