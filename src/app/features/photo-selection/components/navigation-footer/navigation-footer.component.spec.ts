import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NavigationFooterComponent } from './navigation-footer.component';

describe('NavigationFooterComponent', () => {
  let component: NavigationFooterComponent;
  let fixture: ComponentFixture<NavigationFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationFooterComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationFooterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
