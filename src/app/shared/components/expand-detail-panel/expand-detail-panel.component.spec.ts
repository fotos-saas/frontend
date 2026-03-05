import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ExpandDetailPanelComponent } from './expand-detail-panel.component';

describe('ExpandDetailPanelComponent', () => {
  let component: ExpandDetailPanelComponent;
  let fixture: ComponentFixture<ExpandDetailPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpandDetailPanelComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ExpandDetailPanelComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpandDetailPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default loading', () => {
    expect(component.loading()).toBe(false);
  });

  it('should have default empty', () => {
    expect(component.empty()).toBe(false);
  });

  it('should have default emptyText', () => {
    expect(component.emptyText()).toBe('Nincs megjeleníthető adat');
  });

  it('should have default skeletonRows', () => {
    expect(component.skeletonRows()).toBe(2);
  });
});
