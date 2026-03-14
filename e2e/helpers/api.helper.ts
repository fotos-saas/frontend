import { APIRequestContext, request } from '@playwright/test';

/**
 * Backend API helper az E2E tesztekhez.
 *
 * Közvetlenül hívja a Laravel API-t (nem UI-n keresztül),
 * így a seeder műveletek másodpercek alatt lefutnak.
 *
 * Az /e2e/* endpointok CSAK APP_ENV=e2e esetén léteznek!
 */
export class ApiHelper {
  private context!: APIRequestContext;

  constructor(private baseUrl = 'http://localhost:8000') {}

  async init(): Promise<void> {
    this.context = await request.newContext({
      baseURL: this.baseUrl,
    });
  }

  async dispose(): Promise<void> {
    await this.context?.dispose();
  }

  // ─── E2E Endpoints ─────────────────────────────────────

  /** Adatbázis reset + seed */
  async resetDatabase(): Promise<void> {
    const res = await this.context.post('/api/e2e/reset');
    if (!res.ok()) {
      throw new Error(`DB reset failed: ${res.status()} ${await res.text()}`);
    }
  }

  /** E2E health check */
  async health(): Promise<{ success: boolean; env: string }> {
    const res = await this.context.get('/api/e2e/health');
    return res.json();
  }

  /** Diákok seedelése */
  async seedStudents(projectId: number, count: number, className?: string): Promise<{ ids: number[] }> {
    const res = await this.context.post('/api/e2e/seed/students', {
      data: { project_id: projectId, count, class_name: className },
    });
    if (!res.ok()) {
      throw new Error(`Seed students failed: ${res.status()} ${await res.text()}`);
    }
    return res.json();
  }

  /** Projekt + iskola gyors létrehozás */
  async seedProject(data: {
    partnerId: number;
    schoolName: string;
    schoolCity?: string;
    projectName: string;
    classNames?: string[];
    studentsPerClass?: number;
  }): Promise<{ project_id: number; school_id: number; access_code: string }> {
    const res = await this.context.post('/api/e2e/seed/project', {
      data: {
        partner_id: data.partnerId,
        school_name: data.schoolName,
        school_city: data.schoolCity,
        project_name: data.projectName,
        class_names: data.classNames,
        students_per_class: data.studentsPerClass,
      },
    });
    if (!res.ok()) {
      throw new Error(`Seed project failed: ${res.status()} ${await res.text()}`);
    }
    return res.json();
  }

  /** User létrehozás */
  async seedUser(data: {
    name: string;
    email: string;
    password?: string;
    role: string;
  }): Promise<{ user_id: number; email: string }> {
    const res = await this.context.post('/api/e2e/seed/user', {
      data,
    });
    if (!res.ok()) {
      throw new Error(`Seed user failed: ${res.status()} ${await res.text()}`);
    }
    return res.json();
  }

  // ─── Auth Endpoints ────────────────────────────────────

  /** Bejelentkezés és token visszaadás */
  async login(email: string, password: string): Promise<{ token: string; user: Record<string, unknown> }> {
    const res = await this.context.post('/api/auth/login', {
      data: { email, password },
    });
    if (!res.ok()) {
      throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
    }
    return res.json();
  }

  // ─── Authenticated Requests ────────────────────────────

  /** Authentikált GET kérés */
  async get(path: string, token: string): Promise<unknown> {
    const res = await this.context.get(path, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  /** Authentikált POST kérés */
  async post(path: string, token: string, data: Record<string, unknown>): Promise<unknown> {
    const res = await this.context.post(path, {
      headers: { Authorization: `Bearer ${token}` },
      data,
    });
    return res.json();
  }
}
