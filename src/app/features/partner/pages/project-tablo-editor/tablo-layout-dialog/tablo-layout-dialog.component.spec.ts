import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TabloLayoutDialogComponent } from './tablo-layout-dialog.component';

describe('TabloLayoutDialogComponent', () => {
  let component: TabloLayoutDialogComponent;
  let fixture: ComponentFixture<TabloLayoutDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabloLayoutDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TabloLayoutDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
