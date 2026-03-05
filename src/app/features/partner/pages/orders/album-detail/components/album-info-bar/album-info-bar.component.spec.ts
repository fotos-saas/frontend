import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AlbumInfoBarComponent } from './album-info-bar.component';

describe('AlbumInfoBarComponent', () => {
  let component: AlbumInfoBarComponent;
  let fixture: ComponentFixture<AlbumInfoBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlbumInfoBarComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AlbumInfoBarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
