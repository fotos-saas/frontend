import { Observable } from 'rxjs';

/**
 * Iskola opció az autocomplete-hez
 */
export interface SchoolOption {
  id: number;
  name: string;
  city: string | null;
}

/**
 * Projekt létrehozás request
 */
export interface CreateProjectRequest {
  school_id?: number | null;
  class_name?: string | null;
  class_year?: string | null;
}

/**
 * Projekt létrehozás response
 */
export interface CreateProjectResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    [key: string]: unknown;
  };
}

/**
 * Project create service interface
 */
export interface IProjectCreateService {
  createProject(data: CreateProjectRequest): Observable<CreateProjectResponse>;
  getAllSchools(search?: string): Observable<SchoolOption[]>;
}
