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
      extraHTTPHeaders: {
        'Accept': 'application/json',
      },
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
    status?: string;
    classYear?: string;
  }): Promise<{ project_id: number; school_id: number; access_code: string }> {
    const res = await this.context.post('/api/e2e/seed/project', {
      data: {
        partner_id: data.partnerId,
        school_name: data.schoolName,
        school_city: data.schoolCity,
        project_name: data.projectName,
        class_names: data.classNames,
        students_per_class: data.studentsPerClass,
        status: data.status,
        class_year: data.classYear,
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

  /** Csapattag meghívó létrehozás (email küldés nélkül) */
  async seedInvitation(data: {
    partnerId: number;
    email: string;
    role: 'designer' | 'marketer' | 'printer' | 'assistant';
  }): Promise<{ invitation_id: number; code: string; register_url: string }> {
    const res = await this.context.post('/api/e2e/seed/invitation', {
      data: { partner_id: data.partnerId, email: data.email, role: data.role },
    });
    if (!res.ok()) {
      throw new Error(`Seed invitation failed: ${res.status()} ${await res.text()}`);
    }
    return res.json();
  }

  /** Csapattag közvetlen hozzáadása (invite nélkül) */
  async seedTeamMember(data: {
    partnerId: number;
    name: string;
    email: string;
    password?: string;
    role: 'designer' | 'marketer' | 'printer' | 'assistant';
  }): Promise<{ user_id: number; email: string }> {
    const res = await this.context.post('/api/e2e/seed/team-member', {
      data: {
        partner_id: data.partnerId,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      },
    });
    if (!res.ok()) {
      throw new Error(`Seed team member failed: ${res.status()} ${await res.text()}`);
    }
    return res.json();
  }

  /** Nyomda (Print Shop) komplett setup */
  async seedPrintShop(data: {
    name: string;
    email: string;
    password?: string;
    companyName: string;
    connectToPartnerId?: number;
  }): Promise<{ user_id: number; partner_id: number; tablo_partner_id: number; connection_id: number | null }> {
    const res = await this.context.post('/api/e2e/seed/print-shop', {
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        company_name: data.companyName,
        connect_to_partner_id: data.connectToPartnerId,
      },
    });
    if (!res.ok()) {
      throw new Error(`Seed print shop failed: ${res.status()} ${await res.text()}`);
    }
    return res.json();
  }

  /** Kontakt gyors létrehozás */
  async seedContact(data: {
    partnerId: number;
    name: string;
    email?: string;
    phone?: string;
    note?: string;
  }): Promise<{ contact_id: number }> {
    const res = await this.context.post('/api/e2e/seed/contact', {
      data: {
        partner_id: data.partnerId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        note: data.note,
      },
    });
    if (!res.ok()) {
      throw new Error(`Seed contact failed: ${res.status()} ${await res.text()}`);
    }
    return res.json();
  }

  /** Diák archívum rekord gyors létrehozás */
  async seedStudentArchive(data: {
    partnerId: number;
    schoolId: number;
    canonicalName: string;
    className?: string;
  }): Promise<{ student_id: number }> {
    const res = await this.context.post('/api/e2e/seed/student-archive', {
      data: {
        partner_id: data.partnerId,
        school_id: data.schoolId,
        canonical_name: data.canonicalName,
        class_name: data.className,
      },
    });
    if (!res.ok()) {
      throw new Error(`Seed student archive failed: ${res.status()} ${await res.text()}`);
    }
    return res.json();
  }

  /** Értesítés gyors létrehozás */
  async seedNotification(data: {
    userEmail: string;
    title: string;
    message?: string;
    emoji?: string;
    type?: string;
    actionUrl?: string;
    isRead?: boolean;
  }): Promise<{ notification_id: number }> {
    const res = await this.context.post('/api/e2e/seed/notification', {
      data: {
        user_email: data.userEmail,
        title: data.title,
        message: data.message,
        emoji: data.emoji,
        type: data.type,
        action_url: data.actionUrl,
        is_read: data.isRead,
      },
    });
    if (!res.ok()) {
      throw new Error(`Seed notification failed: ${res.status()} ${await res.text()}`);
    }
    return res.json();
  }

  /** Tanár archívum rekord gyors létrehozás */
  async seedTeacher(data: {
    partnerId: number;
    schoolId: number;
    canonicalName: string;
    titlePrefix?: string;
    position?: string;
  }): Promise<{ teacher_id: number }> {
    const res = await this.context.post('/api/e2e/seed/teacher', {
      data: {
        partner_id: data.partnerId,
        school_id: data.schoolId,
        canonical_name: data.canonicalName,
        title_prefix: data.titlePrefix,
        position: data.position,
      },
    });
    if (!res.ok()) {
      throw new Error(`Seed teacher failed: ${res.status()} ${await res.text()}`);
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
