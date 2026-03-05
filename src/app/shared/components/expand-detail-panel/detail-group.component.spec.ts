import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DetailGroupComponent } from './detail-group.component';

describe('DetailGroupComponent', () => {
  let component: DetailGroupComponent;
  let fixture: ComponentFixture<DetailGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailGroupComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(DetailGroupComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailGroupComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('icon', 'test');
    fixture.componentRef.setInput('label', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default countUnit', () => {
    expect(component.countUnit()).toBe('kép');
  });
});
