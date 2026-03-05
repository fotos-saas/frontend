import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ListPaginationComponent } from './list-pagination.component';

describe('ListPaginationComponent', () => {
  let component: ListPaginationComponent;
  let fixture: ComponentFixture<ListPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListPaginationComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ListPaginationComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListPaginationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentPage', 0);
    fixture.componentRef.setInput('totalPages', 0);
    fixture.componentRef.setInput('totalItems', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default itemLabel', () => {
    expect(component.itemLabel()).toBe('elem');
  });

  it('should compute pages', () => {
    expect(component.pages()).toBeDefined();
  });
});
