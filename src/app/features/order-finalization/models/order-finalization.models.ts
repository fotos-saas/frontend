/**
 * Order Finalization Models
 * Megrendelés véglegesítő form interface-ek
 */

/**
 * Kapcsolattartó adatok (Step 1)
 */
export interface ContactData {
  name: string;
  email: string;
  phone: string;
}

/**
 * Alap adatok (Step 2)
 */
export interface BasicInfoData {
  schoolName: string;
  city: string;
  className: string;
  classYear: string;
  quote: string;
}

/**
 * Elképzelés / Design adatok (Step 3)
 */
export interface DesignData {
  fontFamily: string;
  fontColor: string;
  description: string;
  backgroundImageId: string | null;
  attachmentIds: string[];
}

/**
 * Névsor adatok (Step 4)
 */
export interface RosterData {
  studentRoster: string;
  teacherRoster: string;
  sortType: SortType;
  acceptTerms: boolean;
  teacherResolutions?: TeacherResolution[];
}

/**
 * AI tanárnév-párosítás eredmény
 */
export interface TeacherMatchResult {
  inputName: string;
  matchType: 'exact' | 'fuzzy' | 'ai' | 'ai_sonnet' | 'no_match';
  teacherId: number | null;
  teacherName: string | null;
  photoUrl: string | null;
  confidence: number;
}

/**
 * Tanár-párosítás feloldás (diák döntése)
 */
export interface TeacherResolution {
  inputName: string;
  teacherId: number | null;
  resolution: 'matched' | 'send_to_session' | 'caption_only';
}

/**
 * Sorrend típusok - API kompatibilis értékek
 */
export type SortType = 'abc' | 'kozepre' | 'megjegyzesben' | 'mindegy';

/**
 * Sorrend típus opciók select mezőhöz
 */
export const SORT_TYPE_OPTIONS: { value: SortType; label: string }[] = [
  { value: 'abc', label: 'ABC sorrend' },
  { value: 'kozepre', label: 'Középre' },
  { value: 'megjegyzesben', label: 'Megjegyzésben' },
  { value: 'mindegy', label: 'Mindegy' }
];

/**
 * Teljes form adat
 */
export interface OrderFinalizationData {
  contact: ContactData;
  basicInfo: BasicInfoData;
  design: DesignData;
  roster: RosterData;
}

/**
 * Alapértelmezett üres form adat
 */
export const EMPTY_ORDER_FINALIZATION_DATA: OrderFinalizationData = {
  contact: {
    name: '',
    email: '',
    phone: ''
  },
  basicInfo: {
    schoolName: '',
    city: '',
    className: '',
    classYear: '',
    quote: ''
  },
  design: {
    fontFamily: '',
    fontColor: '#000000',
    description: '',
    backgroundImageId: null,
    attachmentIds: []
  },
  roster: {
    studentRoster: '',
    teacherRoster: '',
    sortType: 'abc',
    acceptTerms: false
  }
};

/**
 * Stepper lépések
 */
export const STEPPER_STEPS = [
  'Kapcsolattartó',
  'Alap adatok',
  'Elképzelés',
  'Névsor'
] as const;

/**
 * File upload response
 */
export interface FileUploadResponse {
  success: boolean;
  fileId: string;
  filename: string;
  url: string;
  message?: string;
}

/**
 * Finalize order response
 */
export interface FinalizeOrderResponse {
  success: boolean;
  message: string;
  pdfUrl?: string;
}

/**
 * Preview PDF response
 */
export interface PreviewPdfResponse {
  success: boolean;
  pdfUrl: string;
  message?: string;
}

/**
 * Backend API response for finalization data (GET)
 */
export interface FinalizationDataResponse {
  success: boolean;
  data: {
    // Step 1: Kapcsolattartó
    name: string | null;
    contactEmail: string | null;
    contactPhone: string | null;

    // Step 2: Alap adatok
    schoolName: string | null;
    schoolCity: string | null;
    className: string | null;
    classYear: string | null;
    quote: string | null;

    // Step 3: Elképzelés
    fontFamily: string | null;
    color: string | null;
    description: string | null;
    background: string | null;
    otherFile: string | null;

    // Step 4: Névsor
    sortType: SortType | null;
    studentDescription: string | null;
    teacherDescription: string | null;
    teacherResolutions: TeacherResolution[] | null;

    // Meta
    isFinalized: boolean;
    finalizedAt: string | null;
  } | null;
}

/**
 * Backend API request for saving finalization (POST)
 */
export interface SaveFinalizationRequest {
  // Step 1
  name: string;
  contactEmail: string;
  contactPhone: string;

  // Step 2
  schoolName: string;
  schoolCity?: string;
  className: string;
  classYear: string;
  quote?: string;

  // Step 3
  fontFamily?: string;
  color?: string;
  description?: string;

  // Step 4
  sortType?: SortType;
  studentDescription: string;
  teacherDescription: string;
  teacherResolutions?: TeacherResolution[];
  acceptTerms: boolean;
}
