import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TemplateChooserComponent } from './template-chooser.component';
import { TemplateChooserFacadeService } from './template-chooser-facade.service';

describe('TemplateChooserComponent', () => {
  let component: TemplateChooserComponent;
  let fixture: ComponentFixture<TemplateChooserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateChooserComponent],
      providers: [
        { provide: TemplateChooserFacadeService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateChooserComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
