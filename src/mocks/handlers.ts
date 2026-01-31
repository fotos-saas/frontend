/**
 * MSW (Mock Service Worker) Request Handlers
 *
 * Ez a fájl tartalmazza az összes API endpoint mock-ját teszteléshez.
 * Használható unit tesztekben és E2E tesztekben is.
 */
import { http, HttpResponse, delay } from 'msw';

// Mock adatok
export const mockProject = {
  id: 1,
  name: 'Teszt Projekt 2026',
  schoolName: 'Teszt Gimnázium',
  className: '12.A',
  classYear: '2026',
  partnerName: 'Kovács János',
  partnerEmail: 'kovacs@test.hu',
  partnerPhone: '+36 20 123 4567',
  coordinators: [
    { name: 'Nagy Éva', email: 'nagy.eva@test.hu', phone: '+36 30 111 2222' }
  ],
  contacts: [
    { name: 'Kiss Péter', email: 'kiss.peter@test.hu', phone: '+36 70 333 4444' }
  ],
  hasOrderData: true,
  photoDate: '2026-03-15',
  deadline: '2026-04-30',
  hasMissingPersons: true,
  hasTemplateChooser: true,
  selectedTemplatesCount: 2,
  tabloStatus: {
    id: 1,
    name: 'Folyamatban',
    slug: 'in-progress',
    color: '#3B82F6',
    icon: 'clock'
  },
  shareEnabled: true,
  shareUrl: 'https://test.com/share/abc123',
  isFinalized: false,
  samplesCount: 0,
  missingStats: {
    total: 5,
    withoutPhoto: 3,
    studentsWithoutPhoto: 2,
    teachersWithoutPhoto: 1
  }
};

export const mockUser = {
  id: 1,
  name: 'Teszt Felhasználó',
  email: 'teszt@test.hu',
  type: 'tablo-guest' as const
};

export const mockToken = 'mock-jwt-token-12345';

// API Base URL - környezettől függően
const API_BASE = '/api';

/**
 * MSW Request Handlers
 */
export const handlers = [
  // ============================================
  // AUTH ENDPOINTS
  // ============================================

  /**
   * POST /auth/login-tablo-code
   * Bejelentkezés 6-jegyű kóddal
   */
  http.post(`${API_BASE}/auth/login-tablo-code`, async ({ request }) => {
    await delay(100); // Szimulált késleltetés

    const body = await request.json() as { code: string };

    // Érvényes kódok: 123456, 111111
    if (body.code === '123456' || body.code === '111111') {
      return HttpResponse.json({
        user: mockUser,
        project: mockProject,
        token: mockToken,
        tokenType: 'code',
        canFinalize: true
      });
    }

    // Hibás kód
    return HttpResponse.json(
      { message: 'Érvénytelen belépési kód' },
      { status: 401 }
    );
  }),

  /**
   * POST /auth/login-tablo-share
   * Bejelentkezés megosztási tokennel
   */
  http.post(`${API_BASE}/auth/login-tablo-share`, async ({ request }) => {
    await delay(100);

    const body = await request.json() as { token: string };

    if (body.token && body.token.length > 0) {
      return HttpResponse.json({
        user: mockUser,
        project: { ...mockProject, shareEnabled: true },
        token: mockToken,
        tokenType: 'share',
        canFinalize: false
      });
    }

    return HttpResponse.json(
      { message: 'Érvénytelen megosztási link' },
      { status: 401 }
    );
  }),

  /**
   * POST /auth/login-tablo-preview
   * Bejelentkezés előnézeti tokennel
   */
  http.post(`${API_BASE}/auth/login-tablo-preview`, async ({ request }) => {
    await delay(100);

    const body = await request.json() as { token: string };

    if (body.token && body.token.length > 0) {
      return HttpResponse.json({
        user: mockUser,
        project: mockProject,
        token: mockToken,
        tokenType: 'preview',
        canFinalize: false
      });
    }

    return HttpResponse.json(
      { message: 'Érvénytelen előnézeti link' },
      { status: 401 }
    );
  }),

  /**
   * GET /tablo-frontend/validate-session
   * Session validálás
   */
  http.get(`${API_BASE}/tablo-frontend/validate-session`, async ({ request }) => {
    await delay(50);

    const authHeader = request.headers.get('Authorization');

    if (authHeader && authHeader.includes(mockToken)) {
      return HttpResponse.json({
        valid: true,
        project: mockProject,
        tokenType: 'code',
        canFinalize: true
      });
    }

    return HttpResponse.json(
      { valid: false, message: 'Session lejárt' },
      { status: 401 }
    );
  }),

  /**
   * POST /tablo-frontend/logout
   * Kijelentkezés
   */
  http.post(`${API_BASE}/tablo-frontend/logout`, async () => {
    await delay(50);
    return new HttpResponse(null, { status: 204 });
  }),

  // ============================================
  // PROJECT ENDPOINTS
  // ============================================

  /**
   * POST /tablo-frontend/update-schedule
   * Fotózás időpontjának frissítése
   */
  http.post(`${API_BASE}/tablo-frontend/update-schedule`, async ({ request }) => {
    await delay(100);

    const body = await request.json() as { photo_date: string };

    return HttpResponse.json({
      success: true,
      photoDate: body.photo_date
    });
  }),

  /**
   * PUT /tablo-frontend/contact
   * Kapcsolattartó frissítése
   */
  http.put(`${API_BASE}/tablo-frontend/contact`, async ({ request }) => {
    await delay(100);

    const body = await request.json() as { name: string; email: string; phone: string };

    return HttpResponse.json({
      success: true,
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone
      }
    });
  }),

  // ============================================
  // ORDER DATA ENDPOINTS
  // ============================================

  /**
   * GET /tablo-frontend/order-data
   * Rendelési adatok lekérése
   */
  http.get(`${API_BASE}/tablo-frontend/order-data`, async () => {
    await delay(100);

    return HttpResponse.json({
      success: true,
      data: {
        students: [
          { id: 1, name: 'Teszt Diák 1', localId: 'D001', hasPhoto: true },
          { id: 2, name: 'Teszt Diák 2', localId: 'D002', hasPhoto: false }
        ],
        teachers: [
          { id: 1, name: 'Teszt Tanár 1', localId: 'T001', hasPhoto: true }
        ],
        totalCount: 3,
        withPhotoCount: 2
      }
    });
  }),

  // ============================================
  // TEMPLATE ENDPOINTS
  // ============================================

  /**
   * GET /tablo-frontend/templates
   * Sablonok lekérése
   */
  http.get(`${API_BASE}/tablo-frontend/templates`, async () => {
    await delay(150);

    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          name: 'Klasszikus sablon',
          thumbnailUrl: '/templates/classic.jpg',
          isSelected: true
        },
        {
          id: 2,
          name: 'Modern sablon',
          thumbnailUrl: '/templates/modern.jpg',
          isSelected: false
        }
      ]
    });
  }),

  /**
   * POST /tablo-frontend/templates/select
   * Sablon kiválasztása
   */
  http.post(`${API_BASE}/tablo-frontend/templates/select`, async ({ request }) => {
    await delay(100);

    const body = await request.json() as { templateId: number };

    return HttpResponse.json({
      success: true,
      selectedTemplateId: body.templateId
    });
  }),

  // ============================================
  // FINALIZATION ENDPOINTS
  // ============================================

  /**
   * POST /tablo-frontend/finalize
   * Rendelés véglegesítése
   */
  http.post(`${API_BASE}/tablo-frontend/finalize`, async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      message: 'Rendelés sikeresen véglegesítve'
    });
  }),

  /**
   * GET /tablo-frontend/finalization-status
   * Véglegesítési státusz lekérése
   */
  http.get(`${API_BASE}/tablo-frontend/finalization-status`, async () => {
    await delay(50);

    return HttpResponse.json({
      success: true,
      isFinalized: false,
      canFinalize: true,
      validationErrors: []
    });
  }),

  // ============================================
  // SAMPLES ENDPOINTS
  // ============================================

  /**
   * GET /tablo-frontend/samples
   * Minták lekérése
   */
  http.get(`${API_BASE}/tablo-frontend/samples`, async () => {
    await delay(100);

    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          name: 'Minta 1',
          imageUrl: '/samples/sample1.jpg',
          createdAt: '2026-01-01'
        }
      ]
    });
  }),

  // ============================================
  // FILE UPLOAD ENDPOINTS
  // ============================================

  /**
   * POST /tablo-frontend/upload
   * Fájl feltöltés
   */
  http.post(`${API_BASE}/tablo-frontend/upload`, async () => {
    await delay(300);

    return HttpResponse.json({
      success: true,
      fileId: 'file-123',
      url: '/uploads/test-file.jpg'
    });
  })
];

/**
 * Error handler-ek teszteléshez
 * Használd ezeket hibakezelés teszteléséhez
 */
export const errorHandlers = [
  // Network error szimuláció
  http.post(`${API_BASE}/auth/login-tablo-code`, () => {
    return HttpResponse.error();
  }),

  // 500 Internal Server Error
  http.get(`${API_BASE}/tablo-frontend/validate-session`, () => {
    return HttpResponse.json(
      { message: 'Szerverhiba' },
      { status: 500 }
    );
  }),

  // 429 Too Many Requests
  http.post(`${API_BASE}/auth/login-tablo-code`, () => {
    return HttpResponse.json(
      { message: 'Túl sok próbálkozás' },
      { status: 429 }
    );
  })
];
