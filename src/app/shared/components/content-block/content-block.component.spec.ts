import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ContentBlockComponent } from './content-block.component';

describe('ContentBlockComponent', () => {
  let component: ContentBlockComponent;
  let fixture: ComponentFixture<ContentBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentBlockComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ContentBlockComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentBlockComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default collapsedHeight', () => {
    expect(component.collapsedHeight()).toBe(100);
  });

  it('should have default tolerancePercent', () => {
    expect(component.tolerancePercent()).toBe(20);
  });

  it('should have default expandLabel', () => {
    expect(component.expandLabel()).toBe('Tovább olvasom');
  });

  it('should have default collapseLabel', () => {
    expect(component.collapseLabel()).toBe('Kevesebb');
  });
});
