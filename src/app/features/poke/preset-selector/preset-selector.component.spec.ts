import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PresetSelectorComponent } from './preset-selector.component';

describe('PresetSelectorComponent', () => {
  let component: PresetSelectorComponent;
  let fixture: ComponentFixture<PresetSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PresetSelectorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PresetSelectorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
