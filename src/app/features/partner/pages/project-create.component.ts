import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  ProjectCreateWrapperComponent,
  PROJECT_CREATE_SERVICE,
  PROJECT_CREATE_ROUTE_PREFIX,
} from '../../../shared/components/project-create';
import { PartnerService } from '../services/partner.service';

/**
 * Partner Project Create - Új projekt létrehozása.
 */
@Component({
  selector: 'app-partner-project-create',
  standalone: true,
  imports: [ProjectCreateWrapperComponent],
  providers: [
    { provide: PROJECT_CREATE_SERVICE, useExisting: PartnerService },
    { provide: PROJECT_CREATE_ROUTE_PREFIX, useValue: '/partner' },
  ],
  template: `<app-project-create-wrapper />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerProjectCreateComponent {}
