import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TourStep {
  id: number;
  step_number: number;
  title: string;
  content: string;
  target_selector: string | null;
  placement: string;
  highlight_type: string;
  allow_skip: boolean;
}

export interface HelpTour {
  id: number;
  key: string;
  title: string;
  trigger_route: string;
  steps: TourStep[];
}

export interface TourProgress {
  id: number;
  help_tour_id: number;
  status: 'started' | 'completed' | 'skipped';
  last_step_number: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class HelpTourService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private apiUrl = environment.apiUrl;

  readonly activeTour = signal<HelpTour | null>(null);
  readonly currentStepIndex = signal(0);
  readonly isActive = computed(() => this.activeTour() !== null);

  readonly currentStep = computed(() => {
    const tour = this.activeTour();
    const index = this.currentStepIndex();
    if (!tour || index >= tour.steps.length) return null;
    return tour.steps[index];
  });

  readonly totalSteps = computed(() => this.activeTour()?.steps.length ?? 0);

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(event => {
      if (!this.isActive()) {
        this.checkForTours(event.urlAfterRedirects);
      }
    });
  }

  checkForTours(route: string, role?: string): void {
    const params = new HttpParams()
      .set('route', route)
      .set('role', role ?? 'guest');

    this.http.get<ApiResponse<HelpTour[]>>(`${this.apiUrl}/help/tours`, { params })
      .subscribe(res => {
        if (res.data?.length > 0) {
          this.startTour(res.data[0]);
        }
      });
  }

  startTour(tour: HelpTour): void {
    this.activeTour.set(tour);
    this.currentStepIndex.set(0);
    this.updateProgress(tour.id, 'started', 0);
  }

  nextStep(): void {
    const index = this.currentStepIndex();
    const total = this.totalSteps();
    if (index < total - 1) {
      this.currentStepIndex.set(index + 1);
    } else {
      this.completeTour();
    }
  }

  prevStep(): void {
    const index = this.currentStepIndex();
    if (index > 0) {
      this.currentStepIndex.set(index - 1);
    }
  }

  skipTour(): void {
    const tour = this.activeTour();
    if (tour) {
      this.updateProgress(tour.id, 'skipped', this.currentStepIndex());
    }
    this.activeTour.set(null);
    this.currentStepIndex.set(0);
  }

  completeTour(): void {
    const tour = this.activeTour();
    if (tour) {
      this.updateProgress(tour.id, 'completed', this.totalSteps() - 1);
    }
    this.activeTour.set(null);
    this.currentStepIndex.set(0);
  }

  private updateProgress(tourId: number, status: string, stepNumber: number): void {
    this.http.post(`${this.apiUrl}/help/tours/${tourId}/progress`, {
      status,
      step_number: stepNumber,
    }).subscribe();
  }
}
