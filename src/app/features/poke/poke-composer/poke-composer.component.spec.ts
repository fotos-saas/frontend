import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PokeComposerComponent } from './poke-composer.component';
import { PokeService } from '../../../core/services/poke.service';

describe('PokeComposerComponent', () => {
  let component: PokeComposerComponent;
  let fixture: ComponentFixture<PokeComposerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokeComposerComponent],
      providers: [
        { provide: PokeService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PokeComposerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
