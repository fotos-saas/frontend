import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { QuoteEditorComponent } from './quote-editor.component';
import { QuoteEditorActionsService } from './quote-editor-actions.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('QuoteEditorComponent', () => {
  let component: QuoteEditorComponent;
  let fixture: ComponentFixture<QuoteEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteEditorComponent],
      providers: [
        { provide: QuoteEditorActionsService, useValue: {} },
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(QuoteEditorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
