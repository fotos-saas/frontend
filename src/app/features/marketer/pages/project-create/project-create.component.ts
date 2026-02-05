import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  ProjectCreateWrapperComponent,
  PROJECT_CREATE_SERVICE,
  PROJECT_CREATE_ROUTE_PREFIX,
} from '../../../../shared/components/project-create';
import { MarketerService } from '../../services/marketer.service';

/**
 * Marketer Project Create - Új projekt létrehozása.
 */
@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [ProjectCreateWrapperComponent],
  providers: [
    { provide: PROJECT_CREATE_SERVICE, useExisting: MarketerService },
    { provide: PROJECT_CREATE_ROUTE_PREFIX, useValue: '/marketer' },
  ],
  template: `<app-project-create-wrapper />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCreateComponent {}
