export type GarmentCategory = 't-shirt' | 'shirt' | 'sweatshirt' | 'blouse';

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: GarmentCategory;
  categoryLabel: string;
  color: string;
  price: number;
  imageUrl: string;
  flatGarmentUrl: string;
  description: string;
  material: string;
  fit: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface TryOnJob {
  id: string;
  productId: string;
  product: Product;
  personImageUrl: string;
  resultImageUrl?: string;
  status: JobStatus;
  category?: string;
  modelName?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  processingTimeMs?: number;
  errorCode?: string;
  error?: string;
  isSimulated?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  consentGiven: boolean;
  avatarUrl?: string;
}

// --- Backend API DTOs ---

export interface ApiErrorPayload {
  code: string;
  message: string;
  request_id?: string;
}

export interface ApiUserDto {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
  disabled_at: string | null;
}

export interface AuthTokenDto {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: ApiUserDto;
}

export interface ApiProductDto {
  id: string;
  title: string;
  brand: string;
  description: string;
  category: GarmentCategory;
  color: string;
  price: string | number;
  material: string | null;
  fit: string | null;
  image_key: string;
  tryon_image_key: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiPaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ApiProductListDto {
  items: ApiProductDto[];
  meta: ApiPaginationMeta;
}

export interface ApiTryOnJobCreateDto {
  job_id: string;
  status: JobStatus;
}

export interface ApiTryOnJobDto {
  id: string;
  user_id: string | null;
  product_id: string;
  status: JobStatus;
  category: string;
  model_name: string;
  person_image_url: string | null;
  result_url: string | null;
  error_code: string | null;
  error_message: string | null;
  processing_time_ms: number | null;
  consent_at: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ApiTryOnJobListDto {
  items: ApiTryOnJobDto[];
  meta: ApiPaginationMeta;
}

export interface ApiSavedLookDto {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
}

export interface ApiWishlistItemDto {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}
