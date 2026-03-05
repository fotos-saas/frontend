import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SmartFilterBarComponent } from './smart-filter-bar.component';

describe('SmartFilterBarComponent', () => {
  let component: SmartFilterBarComponent;
  let fixture: ComponentFixture<SmartFilterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartFilterBarComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(SmartFilterBarComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartFilterBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('filterState', { search: vi.fn().mockReturnValue(''), setSearch: vi.fn(), sort: vi.fn().mockReturnValue(null), setSort: vi.fn(), filters: vi.fn().mockReturnValue({}), setFilter: vi.fn(), activeFilterCount: vi.fn().mockReturnValue(0), clearAll: vi.fn() } as any);
    fixture.componentRef.setInput('searchConfig', { placeholder: 'Keresés', debounceMs: 300 } as any);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
