import { InjectionToken } from '@angular/core';
import { IProjectCreateService } from './project-create.types';

/**
 * Project create service token
 */
export const PROJECT_CREATE_SERVICE = new InjectionToken<IProjectCreateService>('ProjectCreateService');

/**
 * Route prefix token (pl. '/marketer' vagy '/partner')
 */
export const PROJECT_CREATE_ROUTE_PREFIX = new InjectionToken<string>('ProjectCreateRoutePrefix');
