import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LightboxComponent } from './lightbox.component';
import { DragScrollService } from '../../services/drag-scroll.service';
import { LightboxThumbnailService } from './lightbox-thumbnail.service';

describe('LightboxComponent', () => {
  let component: LightboxComponent;
  let fixture: ComponentFixture<LightboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LightboxComponent],
      providers: [
        { provide: DragScrollService, useValue: {} },
        { provide: LightboxThumbnailService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LightboxComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
