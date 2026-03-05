import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { InfoBoxComponent } from './info-box.component';

describe('InfoBoxComponent', () => {
  let component: InfoBoxComponent;
  let fixture: ComponentFixture<InfoBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoBoxComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(InfoBoxComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoBoxComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('storageKey', 'test');
    fixture.componentRef.setInput('title', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default theme', () => {
    expect(component.theme()).toBe('blue');
  });

  it('should have default mode', () => {
    expect(component.mode()).toBe('inline');
  });
});
