import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PhotoThumbListComponent } from './photo-thumb-list.component';

describe('PhotoThumbListComponent', () => {
  let component: PhotoThumbListComponent;
  let fixture: ComponentFixture<PhotoThumbListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoThumbListComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PhotoThumbListComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhotoThumbListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('photos', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default size', () => {
    expect(component.size()).toBe('md');
  });

  it('should have default highlight', () => {
    expect(component.highlight()).toBe(false);
  });
});
