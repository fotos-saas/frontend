/**
 * Valós idejű feltöltési állapot.
 * Minden upload ponton ez a közös interface jelenik meg.
 */
export interface FileUploadProgress {
  /** Feltöltés fázisa */
  phase: 'uploading' | 'processing' | 'completed' | 'error';

  /** HTTP transfer progress (0-100) - byte-szintű */
  transferProgress: number;

  /** Backend feldolgozás progress (0-100) - ZIP kicsomagolás */
  processingProgress: number;

  /** Összesített progress a UI-hoz (0-100) */
  overallProgress: number;

  /** Aktuális chunk sorszáma */
  currentChunk: number;

  /** Összes chunk száma */
  totalChunks: number;

  /** Eddig sikeresen feltöltött képek száma */
  uploadedCount: number;

  /** Összes feltöltendő kép száma */
  totalCount: number;

  /** Hibás feltöltések száma */
  errorCount: number;

  /** Feltöltés befejeződött-e */
  completed: boolean;

  /** Hiba üzenet (ha van) */
  errorMessage?: string;

  /** Eddig feltöltött képek (chunk-onként beérkeznek) */
  photos: UploadedPhotoResult[];
}

/** Feltöltött kép eredmény (backend válasz) */
export interface UploadedPhotoResult {
  mediaId: number;
  filename: string;
  iptcTitle?: string;
  thumbUrl: string;
  fullUrl?: string;
}

/** Backend ZIP feldolgozás polling válasz */
export interface ZipProcessingStatus {
  status: 'processing' | 'completed' | 'error';
  totalFiles: number;
  processedFiles: number;
  uploadedPhotos: UploadedPhotoResult[];
  errorMessage?: string;
}
