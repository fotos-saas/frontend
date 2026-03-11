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
  thumbnailUrl: string | null;
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
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
