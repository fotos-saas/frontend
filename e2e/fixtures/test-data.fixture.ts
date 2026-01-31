/**
 * Test Data Fixtures
 *
 * Gyakran használt teszt adatok és mockolt API válaszok
 * Az E2E tesztekben használható előre definiált adatok
 */

/**
 * Mockolt TabloProject adatok
 * Alapértelmezett projekt adatok a tesztekhez
 */
export const mockProjectData = {
  // Teljes projekt adatok (összes mező)
  complete: {
    id: 'project-123',
    name: 'Tabuló 2024',
    schoolName: 'Petőfi Sándor Általános Iskola',
    className: '5.A',
    classYear: '2024',
    photoDate: '2024-03-15',
    photoTime: '10:00',
    shareUrl: 'https://tablo.example.com/projects/project-123/share/abc123',
    contacts: [
      {
        id: 'contact-1',
        name: 'Nagy Péter',
        email: 'peter.nagy@example.com',
        phone: '+36701234567',
      },
    ],
    samplesCount: 5,
    selectedTemplatesCount: 2,
    hasTemplateChooser: true,
    hasMissingPersons: true,
    hasOrderData: true,
    isFinalized: false,
    canFinalize: true,
    missingStats: {
      total: 25,
      withoutPhoto: 3,
      studentsWithoutPhoto: 2,
      teachersWithoutPhoto: 1,
    },
  },

  // Minimal projekt adatok (csupán alapadatok)
  minimal: {
    id: 'project-456',
    name: 'Test Projekt',
    schoolName: 'Test Iskola',
    className: '1.A',
    classYear: null,
    photoDate: null,
    photoTime: null,
    shareUrl: null,
    contacts: [],
    samplesCount: 0,
    selectedTemplatesCount: 0,
    hasTemplateChooser: false,
    hasMissingPersons: false,
    hasOrderData: false,
    isFinalized: false,
    canFinalize: false,
    missingStats: null,
  },

  // Projekt fotózás dátummal
  withPhotoDate: {
    id: 'project-789',
    name: 'Foto 2024',
    schoolName: 'Arany János Gimnázium',
    className: '12.B',
    classYear: '2024',
    photoDate: '2024-04-20',
    photoTime: '14:30',
    shareUrl: 'https://tablo.example.com/projects/project-789/share/xyz789',
    contacts: [
      {
        id: 'contact-2',
        name: 'Szabó Éva',
        email: 'eva.szabo@example.com',
        phone: '+36702345678',
      },
    ],
    samplesCount: 3,
    selectedTemplatesCount: 1,
    hasTemplateChooser: false,
    hasMissingPersons: true,
    hasOrderData: true,
    isFinalized: false,
    canFinalize: true,
    missingStats: {
      total: 32,
      withoutPhoto: 5,
      studentsWithoutPhoto: 4,
      teachersWithoutPhoto: 1,
    },
  },

  // Véglegesített projekt
  finalized: {
    id: 'project-finalized',
    name: 'Véglegesített Projekt',
    schoolName: 'Kossuth Lajos Iskola',
    className: '3.C',
    classYear: '2024',
    photoDate: '2024-02-10',
    photoTime: '11:00',
    shareUrl: 'https://tablo.example.com/projects/finalized/share/fin123',
    contacts: [
      {
        id: 'contact-3',
        name: 'Horváth János',
        email: 'janos.horvath@example.com',
        phone: '+36703456789',
      },
    ],
    samplesCount: 10,
    selectedTemplatesCount: 5,
    hasTemplateChooser: false,
    hasMissingPersons: false,
    hasOrderData: true,
    isFinalized: true,
    canFinalize: true,
    missingStats: null,
  },
};

/**
 * Mockolt ContactPerson adatok
 */
export const mockContactData = {
  primary: {
    id: 'contact-1',
    name: 'Nagy Péter',
    email: 'peter.nagy@example.com',
    phone: '+36701234567',
  },

  empty: {
    id: 'contact-empty',
    name: '',
    email: '',
    phone: '',
  },

  noEmail: {
    id: 'contact-no-email',
    name: 'Sándor István',
    email: '',
    phone: '+36704567890',
  },

  noPhone: {
    id: 'contact-no-phone',
    name: 'Kiss Márta',
    email: 'marta.kiss@example.com',
    phone: '',
  },
};

/**
 * Teszt URL-ek
 */
export const testUrls = {
  home: '/',
  samples: '/samples',
  templateChooser: '/template-chooser',
  missingPersons: '/missing-persons',
  orderData: '/order-data',
  orderFinalization: '/order-finalization',
};

/**
 * Szövegállandók a tesztekhez
 */
export const testStrings = {
  // Schedule szekció
  scheduleLabel: 'Fotózás időpontja',
  scheduleEmpty: 'Nincs beállítva',
  scheduleButton: {
    set: 'Beállítás',
    edit: 'Módosítás',
  },

  // Contact szekció
  contactLabel: 'Kapcsolattartó',

  // Missing persons
  missingPersonsAlertTitle: 'személynek nincs képe',

  // Navigation
  samplesTitle: 'Minták',
  templateChooserTitle: 'Minta Választó',
  missingPersonsTitle: 'Hiányzó képek',
  orderDataTitle: 'Megrendelési adatok',

  // Dialógusok
  scheduleReminderDialog: 'Fotózás időpont',
  finalizationReminderDialog: 'Véglegesítés',
  contactEditDialog: 'Kapcsolattartó szerkesztése',
};

/**
 * Ellenőrző adatok az E2E tesztekhez
 */
export const validationData = {
  // Érvényes email formátumok
  validEmails: [
    'test@example.com',
    'user.name+tag@example.co.uk',
    'info@company.org',
  ],

  // Érvényes telefonszámok
  validPhones: [
    '+36701234567',
    '0070 1234 567',
    '+36 70 123 4567',
  ],

  // Érvénytelen adatok
  invalid: {
    email: 'not-an-email',
    phone: 'abc123',
  },
};
