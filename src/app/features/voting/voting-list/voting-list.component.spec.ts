import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { VotingListComponent } from './voting-list.component';
import { VotingListFacadeService } from './voting-list-facade.service';

describe('VotingListComponent', () => {
  let component: VotingListComponent;
  let fixture: ComponentFixture<VotingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VotingListComponent],
      providers: [
        { provide: VotingListFacadeService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(VotingListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
