import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { InviteDialogComponent } from './invite-dialog.component';
import { TeamService } from '../../../services/team.service';

describe('InviteDialogComponent', () => {
  let component: InviteDialogComponent;
  let fixture: ComponentFixture<InviteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviteDialogComponent],
      providers: [
        { provide: TeamService, useValue: { roles: [], invite: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(InviteDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
