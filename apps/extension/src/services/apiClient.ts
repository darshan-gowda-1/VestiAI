import type { ExtensionJobStatus, ExtractedProductContext } from '../types';

export const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';
export const DEFAULT_WEB_APP_URL = 'http://localhost:5173';

export async function verifyExtensionSession(
  apiBaseUrl: string,
  token: string
): Promise<{ authenticated: boolean; user?: { email: string; full_name?: string | null } }> {
  const res = await fetch(`${apiBaseUrl}/extension/session`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Session expired or invalid token. Please sign in again.');
  }
  return res.json();
}

export async function registerProductContext(
  apiBaseUrl: string,
  token: string,
  product: ExtractedProductContext
): Promise<void> {
  const res = await fetch(`${apiBaseUrl}/extension/product`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      image_url: product.imageUrl,
      page_url: product.pageUrl,
      title: product.title,
      retailer_domain: product.retailerDomain,
    }),
  });
  if (!res.ok) {
    throw new Error('Unable to register product context with VestiAI.');
  }
}

export async function fetchGarmentBlob(imageUrl: string): Promise<Blob> {
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.blob();
  } catch {
    throw new Error(
      'This retailer blocks direct cross-origin image access. Download the garment image or open VestiAI web to try on.'
    );
  }
}

export async function submitExtensionTryOn(
  apiBaseUrl: string,
  token: string,
  params: {
    personFile: File;
    garmentBlob: Blob;
    consent: boolean;
    retailerUrl: string;
    productTitle?: string | null;
  }
): Promise<{ job_id: string; status: string }> {
  const form = new FormData();
  form.append('person_image', params.personFile);
  form.append('garment_image', params.garmentBlob, 'garment.png');
  form.append('consent', String(params.consent));
  form.append('category', 'upper_body');
  form.append('retailer_url', params.retailerUrl);
  if (params.productTitle) {
    form.append('product_title', params.productTitle);
  }

  const res = await fetch(`${apiBaseUrl}/extension/tryon`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to submit try-on job.');
  }
  return res.json();
}

export async function getJobStatus(
  apiBaseUrl: string,
  token: string,
  jobId: string
): Promise<ExtensionJobStatus> {
  const res = await fetch(`${apiBaseUrl}/tryon/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Unable to check job status.');
  }
  return res.json();
}

export async function saveLookToAccount(
  apiBaseUrl: string,
  token: string,
  jobId: string
): Promise<void> {
  const res = await fetch(`${apiBaseUrl}/saved-looks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ job_id: jobId }),
  });
  if (!res.ok) {
    throw new Error('Unable to save look.');
  }
}

