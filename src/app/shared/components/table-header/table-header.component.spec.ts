import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TableHeaderComponent } from './table-header.component';

describe('TableHeaderComponent', () => {
  let component: TableHeaderComponent;
  let fixture: ComponentFixture<TableHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableHeaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(TableHeaderComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default sortBy', () => {
    expect(component.sortBy()).toBe('');
  });

  it('should have default sortDir', () => {
    expect(component.sortDir()).toBe('asc');
  });

  it('should compute gridTemplate', () => {
    expect(component.gridTemplate()).toBeDefined();
  });
});
