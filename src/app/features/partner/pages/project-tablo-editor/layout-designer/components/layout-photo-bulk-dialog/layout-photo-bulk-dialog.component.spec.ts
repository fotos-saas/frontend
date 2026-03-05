import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LayoutPhotoBulkDialogComponent } from './layout-photo-bulk-dialog.component';
import { PartnerAlbumService } from '../../../../../services/partner-album.service';

describe('LayoutPhotoBulkDialogComponent', () => {
  let component: LayoutPhotoBulkDialogComponent;
  let fixture: ComponentFixture<LayoutPhotoBulkDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutPhotoBulkDialogComponent],
      providers: [
        { provide: PartnerAlbumService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutPhotoBulkDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
