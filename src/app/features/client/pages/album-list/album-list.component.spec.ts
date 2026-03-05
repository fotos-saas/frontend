import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ClientAlbumListComponent } from './album-list.component';
import { AlbumListStateService } from './album-list-state.service';

describe('ClientAlbumListComponent', () => {
  let component: ClientAlbumListComponent;
  let fixture: ComponentFixture<ClientAlbumListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientAlbumListComponent],
      providers: [
        { provide: AlbumListStateService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientAlbumListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
