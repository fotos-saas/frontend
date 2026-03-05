import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { InfoHelpItemComponent } from './info-help-item.component';

describe('InfoHelpItemComponent', () => {
  let component: InfoHelpItemComponent;
  let fixture: ComponentFixture<InfoHelpItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoHelpItemComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(InfoHelpItemComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoHelpItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('icon', 'test');
    fixture.componentRef.setInput('title', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default color', () => {
    expect(component.color()).toBe('blue');
  });
});
