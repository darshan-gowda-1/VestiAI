export interface ExtractedProductContext {
  imageUrl: string;
  pageUrl: string;
  title: string | null;
  retailerDomain: string;
  alt?: string;
}

export interface ExtensionSettings {
  apiBaseUrl: string;
  webAppUrl: string;
  accessToken: string | null;
}

export interface ExtensionJobStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  result_url?: string | null;
  error_message?: string | null;
  model_name?: string;
}

