import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReceivedPokesDialogComponent } from './received-pokes-dialog.component';
import { DateUtilsService } from '@shared/services/date-utils.service';

describe('ReceivedPokesDialogComponent', () => {
  let component: ReceivedPokesDialogComponent;
  let fixture: ComponentFixture<ReceivedPokesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceivedPokesDialogComponent],
      providers: [
        { provide: DateUtilsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceivedPokesDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
