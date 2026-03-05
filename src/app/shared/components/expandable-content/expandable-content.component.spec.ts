import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ExpandableContentComponent } from './expandable-content.component';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

describe('ExpandableContentComponent', () => {
  let component: ExpandableContentComponent;
  let fixture: ComponentFixture<ExpandableContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpandableContentComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ExpandableContentComponent, {
      set: { imports: [SafeHtmlPipe], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpandableContentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('content', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
