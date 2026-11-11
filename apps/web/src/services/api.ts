import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  ApiErrorPayload,
  ApiProductDto,
  ApiProductListDto,
  ApiSavedLookDto,
  ApiTryOnJobCreateDto,
  ApiTryOnJobDto,
  ApiTryOnJobListDto,
  ApiUserDto,
  ApiWishlistItemDto,
  AuthTokenDto,
  GarmentCategory,
  Product,
  TryOnJob,
  User,
} from '../types';

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const API_ORIGIN: string = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://localhost:8000';
  }
})();

export const TOKEN_STORAGE_KEY = 'vestiai_access_token';

export class ApiError extends Error {
  code: string;
  status: number;
  requestId?: string;

  constructor(message: string, code = 'API_ERROR', status = 500, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export function resolveMediaUrl(keyOrUrl?: string | null): string {
  if (!keyOrUrl) return '';
  if (
    keyOrUrl.startsWith('http://') ||
    keyOrUrl.startsWith('https://') ||
    keyOrUrl.startsWith('data:') ||
    keyOrUrl.startsWith('blob:')
  ) {
    return keyOrUrl;
  }
  if (keyOrUrl.startsWith('/api/')) {
    return `${API_ORIGIN}${keyOrUrl}`;
  }
  if (keyOrUrl.startsWith('catalog/')) {
    return `${API_BASE_URL}/media/catalog/${keyOrUrl.slice('catalog/'.length)}`;
  }
  return `${API_BASE_URL}/media/${keyOrUrl.replace(/^\/+/, '')}`;
}

const CATEGORY_LABELS: Record<GarmentCategory, string> = {
  't-shirt': 'T-Shirts',
  shirt: 'Shirts',
  sweatshirt: 'Sweatshirts',
  blouse: 'Blouses',
};

export function mapProductDto(dto: ApiProductDto): Product {
  return {
    id: dto.id,
    title: dto.title,
    brand: dto.brand,
    category: dto.category,
    categoryLabel: CATEGORY_LABELS[dto.category] || 'Tops',
    color: dto.color,
    price: typeof dto.price === 'string' ? parseFloat(dto.price) : dto.price,
    imageUrl: resolveMediaUrl(dto.image_key),
    flatGarmentUrl: resolveMediaUrl(dto.tryon_image_key),
    description: dto.description,
    material: dto.material || '100% Cotton',
    fit: dto.fit || 'Regular Fit',
    isFeatured: dto.is_featured,
    isActive: dto.is_active,
  };
}

export function mapUserDto(dto: ApiUserDto, consentGiven = true): User {
  return {
    id: dto.id,
    name: dto.full_name || dto.email.split('@')[0],
    email: dto.email,
    role: dto.role,
    consentGiven,
  };
}

export function mapTryOnJobDto(dto: ApiTryOnJobDto, product: Product): TryOnJob {
  return {
    id: dto.id,
    productId: dto.product_id,
    product,
    personImageUrl: resolveMediaUrl(dto.person_image_url),
    resultImageUrl: dto.result_url ? resolveMediaUrl(dto.result_url) : undefined,
    status: dto.status,
    category: dto.category,
    modelName: dto.model_name,
    createdAt: dto.created_at,
    startedAt: dto.started_at || undefined,
    completedAt: dto.completed_at || undefined,
    processingTimeMs: dto.processing_time_ms ?? undefined,
    errorCode: dto.error_code || undefined,
    error: dto.error_message || undefined,
    isSimulated: dto.model_name.includes('stub'),
  };
}

let sessionExpiredHandler: (() => void) | null = null;

export function registerSessionExpiredHandler(handler: () => void): void {
  sessionExpiredHandler = handler;
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
  });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorPayload>) => {
      const status = error.response?.status ?? 0;
      const payload = error.response?.data;
      const url = error.config?.url || '';

      if (
        status === 401 &&
        !url.includes('/auth/login') &&
        !url.includes('/auth/register')
      ) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (sessionExpiredHandler) {
          sessionExpiredHandler();
        }
      }

      if (payload && typeof payload === 'object' && 'message' in payload) {
        return Promise.reject(
          new ApiError(
            payload.message,
            payload.code || 'API_ERROR',
            status,
            payload.request_id
          )
        );
      }

      const fallbackMessage =
        status === 0
          ? 'Unable to reach VestiAI API server. Please ensure the backend is running.'
          : error.message || 'An unexpected network error occurred.';
      return Promise.reject(new ApiError(fallbackMessage, 'NETWORK_ERROR', status));
    }
  );

  return client;
}

export const apiClient = createApiClient();

// --- Domain API Clients ---

export const authApi = {
  async register(email: string, password: string, fullName?: string): Promise<AuthTokenDto> {
    const { data } = await apiClient.post<AuthTokenDto>('/auth/register', {
      email,
      password,
      full_name: fullName || undefined,
    });
    return data;
  },

  async login(email: string, password: string): Promise<AuthTokenDto> {
    const { data } = await apiClient.post<AuthTokenDto>('/auth/login', {
      email,
      password,
    });
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getMe(): Promise<ApiUserDto> {
    const { data } = await apiClient.get<ApiUserDto>('/auth/me');
    return data;
  },

  async updateProfile(fullName: string): Promise<ApiUserDto> {
    const { data } = await apiClient.patch<ApiUserDto>('/users/me', {
      full_name: fullName,
    });
    return data;
  },
};

export const catalogApi = {
  async listProducts(params?: {
    category?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiProductListDto> {
    const { data } = await apiClient.get<ApiProductListDto>('/products', { params });
    return data;
  },

  async getProduct(id: string): Promise<ApiProductDto> {
    const { data } = await apiClient.get<ApiProductDto>(`/products/${id}`);
    return data;
  },

  async adminCreateProduct(payload: {
    title: string;
    brand: string;
    description: string;
    category: GarmentCategory;
    color: string;
    price: string | number;
    material?: string;
    fit?: string;
    image_key: string;
    tryon_image_key: string;
    is_featured?: boolean;
  }): Promise<ApiProductDto> {
    const { data } = await apiClient.post<ApiProductDto>('/admin/products', payload);
    return data;
  },

  async adminArchiveProduct(id: string): Promise<ApiProductDto> {
    const { data } = await apiClient.delete<ApiProductDto>(`/admin/products/${id}`);
    return data;
  },

  async adminListProducts(limit = 100): Promise<ApiProductListDto> {
    const { data } = await apiClient.get<ApiProductListDto>('/admin/products', {
      params: { limit, include_inactive: true },
    });
    return data;
  },

  async adminUpdateProduct(
    id: string,
    payload: Partial<{
      title: string;
      brand: string;
      description: string;
      category: GarmentCategory;
      color: string;
      price: string | number;
      is_active: boolean;
      is_featured: boolean;
    }>
  ): Promise<ApiProductDto> {
    const { data } = await apiClient.patch<ApiProductDto>(`/admin/products/${id}`, payload);
    return data;
  },

  async adminUploadProductImage(id: string, file: File): Promise<ApiProductDto> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiProductDto>(`/admin/products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export const tryonApi = {
  async submitJob(params: {
    personImageFile: File;
    productId: string;
    consent: boolean;
    category?: string;
  }): Promise<ApiTryOnJobCreateDto> {
    const formData = new FormData();
    formData.append('person_image', params.personImageFile);
    formData.append('product_id', params.productId);
    formData.append('consent', String(params.consent));
    formData.append('category', params.category || 'upper_body');

    const { data } = await apiClient.post<ApiTryOnJobCreateDto>('/tryon/jobs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getJob(jobId: string): Promise<ApiTryOnJobDto> {
    const { data } = await apiClient.get<ApiTryOnJobDto>(`/tryon/jobs/${jobId}`);
    return data;
  },

  async listJobs(page = 1, limit = 20): Promise<ApiTryOnJobListDto> {
    const { data } = await apiClient.get<ApiTryOnJobListDto>('/tryon/jobs', {
      params: { page, limit },
    });
    return data;
  },

  async cancelJob(jobId: string): Promise<ApiTryOnJobDto> {
    const { data } = await apiClient.post<ApiTryOnJobDto>(`/tryon/jobs/${jobId}/cancel`);
    return data;
  },

  async deleteJob(jobId: string): Promise<void> {
    await apiClient.delete(`/tryon/jobs/${jobId}`);
  },

  async purgeAllJobs(): Promise<void> {
    await apiClient.delete('/tryon/jobs');
  },
};

export interface AdminJobSummaryDto {
  id: string;
  product_id: string;
  status: string;
  category: string;
  model_name: string;
  error_code: string | null;
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface AdminUsageStatsDto {
  total_users: number;
  active_products: number;
  archived_products: number;
  total_jobs: number;
  queued_jobs: number;
  processing_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  cancelled_jobs: number;
  avg_processing_time_ms: number | null;
  total_saved_looks: number;
}

export interface AdminAuditLogDto {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  summary: string | null;
  created_at: string;
}

export const adminApi = {
  async listJobs(page = 1, limit = 50): Promise<{ items: AdminJobSummaryDto[] }> {
    const { data } = await apiClient.get<{ items: AdminJobSummaryDto[] }>('/admin/jobs', {
      params: { page, limit },
    });
    return data;
  },

  async getStats(): Promise<AdminUsageStatsDto> {
    const { data } = await apiClient.get<AdminUsageStatsDto>('/admin/stats');
    return data;
  },

  async listAuditLogs(page = 1, limit = 50): Promise<{ items: AdminAuditLogDto[] }> {
    const { data } = await apiClient.get<{ items: AdminAuditLogDto[] }>('/admin/audit-logs', {
      params: { page, limit },
    });
    return data;
  },
};

export const collectionsApi = {
  async listSavedLooks(): Promise<ApiSavedLookDto[]> {
    const { data } = await apiClient.get<ApiSavedLookDto[]>('/saved-looks');
    return data;
  },

  async saveLook(jobId: string): Promise<ApiSavedLookDto> {
    const { data } = await apiClient.post<ApiSavedLookDto>('/saved-looks', {
      job_id: jobId,
    });
    return data;
  },

  async removeSavedLook(jobId: string): Promise<void> {
    await apiClient.delete(`/saved-looks/${jobId}`);
  },

  async listWishlist(): Promise<ApiWishlistItemDto[]> {
    const { data } = await apiClient.get<ApiWishlistItemDto[]>('/wishlist');
    return data;
  },

  async addToWishlist(productId: string): Promise<ApiWishlistItemDto> {
    const { data } = await apiClient.post<ApiWishlistItemDto>('/wishlist', {
      product_id: productId,
    });
    return data;
  },

  async removeFromWishlist(productId: string): Promise<void> {
    await apiClient.delete(`/wishlist/${productId}`);
  },
};

