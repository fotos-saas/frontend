import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ContactEditDialogComponent } from './contact-edit-dialog.component';

describe('ContactEditDialogComponent', () => {
  let component: ContactEditDialogComponent;
  let fixture: ComponentFixture<ContactEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactEditDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ContactEditDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default isSaving', () => {
    expect(component.isSaving()).toBe(false);
  });
});
