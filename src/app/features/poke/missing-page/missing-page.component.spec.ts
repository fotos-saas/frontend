import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MissingPageComponent } from './missing-page.component';
import { PokeService } from '../../../core/services/poke.service';
import { ToastService } from '../../../core/services/toast.service';
import { MissingFilterService } from '../services/missing-filter.service';

describe('MissingPageComponent', () => {
  let component: MissingPageComponent;
  let fixture: ComponentFixture<MissingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissingPageComponent],
      providers: [
        { provide: PokeService, useValue: {} },
        { provide: ToastService, useValue: {} },
        { provide: MissingFilterService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MissingPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
