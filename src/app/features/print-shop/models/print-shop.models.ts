export interface PrintShopStats {
  partner_name: string;
  stats: {
    in_print: number;
    done_this_month: number;
    connected_studios: number;
    pending_requests: number;
  };
  connected_studios: PrintShopStudio[];
}

export interface PrintShopStudio {
  id: number;
  name: string;
}

export interface PrintShopProject {
  id: number;
  name: string;
  schoolName: string | null;
  className: string | null;
  classYear: string | null;
  status: 'in_print' | 'done';
  tabloSize: string | null;
  studioName: string | null;
  studioId: number;
  inPrintAt: string | null;
  doneAt: string | null;
  hasPrintFile: boolean;
  printFileType: string | null;
  hasSample: boolean;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  printShopDownloadedAt: string | null;
  printShopDownloadCount: number;
  printCopies: number;
  printDeadline: string | null;
  printDeadlineStatus: 'pending' | 'accepted' | 'modified' | null;
  printDeadlineProposed: string | null;
  isUrgent: boolean;
  isReprint: boolean;
  reprintCount: number;
  unreadMessagesCount: number;
  totalMessagesCount: number;
}

export interface PrintShopProjectDetail extends PrintShopProject {
  printFiles: PrintShopPrintFile[];
  contacts: PrintShopContact[];
}

export interface PrintShopPrintFile {
  type: string;
  fileName: string;
  size: number;
  uploadedAt: string;
}

export interface PrintShopContact {
  name: string;
  phone: string | null;
  email: string | null;
}

export interface PrintShopProjectListParams {
  per_page?: number;
  page?: number;
  status?: 'in_print' | 'done' | null;
  search?: string;
  studio_id?: number | null;
  class_year?: string;
  project_id?: number | null;
}

// === Connection modellek ===

export interface PrintShopConnectionStudio {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface PrintShopConnection {
  id: number;
  photoStudio: PrintShopConnectionStudio;
  status: 'active' | 'pending' | 'inactive';
  statusName: string;
  initiatedBy: 'photo_studio' | 'print_shop';
  createdAt: string;
  updatedAt: string;
}

export interface PrintShopConnectionRequest {
  id: number;
  photoStudio: { id: number; name: string; email: string | null };
  initiatedBy: 'photo_studio' | 'print_shop';
  createdAt: string;
}

export interface PrintShopConnectionRequests {
  incoming: PrintShopConnectionRequest[];
  outgoing: PrintShopConnectionRequest[];
}

// === Dashboard modellek ===

export interface PrintShopDashboardProject {
  id: number;
  name: string;
  schoolName: string | null;
  className: string | null;
  tabloSize: string | null;
  studioName: string | null;
  inPrintAt: string | null;
  daysWaiting: number;
  urgency: 'normal' | 'warning' | 'critical';
  hasPrintFile: boolean;
  printFileType: string | null;
  hasSample: boolean;
  thumbnailUrl: string | null;
}

export interface PrintShopDashboardData {
  recent_projects: PrintShopDashboardProject[];
  overdue_projects: PrintShopDashboardProject[];
}

// Re-export from canonical source
export type { PaginatedResponse } from '../../../core/models/api.models';
