import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TopLoadingBarComponent } from './top-loading-bar.component';
import { NavigationLoadingService } from '../../../core/services/navigation-loading.service';

describe('TopLoadingBarComponent', () => {
  let component: TopLoadingBarComponent;
  let fixture: ComponentFixture<TopLoadingBarComponent>;

  beforeEach(async () => {
    const mockNavigationLoadingService = {
      isNavigating: vi.fn().mockReturnValue(null)
    };

    await TestBed.configureTestingModule({
      imports: [TopLoadingBarComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: NavigationLoadingService, useValue: mockNavigationLoadingService }
      ],
    })
    .overrideComponent(TopLoadingBarComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopLoadingBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
