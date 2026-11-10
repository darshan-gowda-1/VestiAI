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
}

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface TryOnJob {
  id: string;
  productId: string;
  product: Product;
  personImageUrl: string;
  resultImageUrl?: string;
  status: JobStatus;
  createdAt: string;
  completedAt?: string;
  processingTimeMs?: number;
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
