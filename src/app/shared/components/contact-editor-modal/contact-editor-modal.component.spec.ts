import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ContactEditorModalComponent } from './contact-editor-modal.component';
import { PROJECT_DETAIL_SERVICE } from '../project-detail/project-detail.tokens';

describe('ContactEditorModalComponent', () => {
  let component: ContactEditorModalComponent;
  let fixture: ComponentFixture<ContactEditorModalComponent>;

  beforeEach(async () => {
    const mockPROJECT_DETAIL_SERVICE = {};

    await TestBed.configureTestingModule({
      imports: [ContactEditorModalComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PROJECT_DETAIL_SERVICE, useValue: mockPROJECT_DETAIL_SERVICE }
      ],
    })
    .overrideComponent(ContactEditorModalComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactEditorModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projectId', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close', () => {
    const spy = vi.fn();
    component.close.subscribe(spy);
    component.close.emit();
    expect(spy).toHaveBeenCalled();
  });
});
