import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SearchableDropdownComponent } from './searchable-dropdown.component';

describe('SearchableDropdownComponent', () => {
  let component: SearchableDropdownComponent;
  let fixture: ComponentFixture<SearchableDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableDropdownComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchableDropdownComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
