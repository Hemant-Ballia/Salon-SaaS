export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    message?: string;
    details?: unknown;
    stack?: string;
  };
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T[];
  pagination?: PaginationMeta;
  meta?: PaginationMeta;
}
