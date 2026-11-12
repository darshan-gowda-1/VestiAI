import {
  DEFAULT_API_BASE_URL,
  fetchGarmentBlob,
  getJobStatus,
  saveLookToAccount,
  submitExtensionTryOn,
} from '../services/apiClient';
import type { ExtractedProductContext } from '../types';

const rootEl = document.getElementById('sidepanel-app');

let selectedProduct: ExtractedProductContext | null = null;
let personFile: File | null = null;
let consentChecked = false;
let accessToken = '';
let apiBaseUrl = DEFAULT_API_BASE_URL;
let statusText = 'Select a garment from the VestiAI popup, choose your photo, and accept consent.';
let resultUrl: string | null = null;
let lastJobId: string | null = null;
let isBusy = false;

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function render(): void {
  if (!rootEl) return;

  rootEl.innerHTML = `
    <div class="header">
      <div class="brand">Vesti<span class="accent">AI</span> Side Panel</div>
    </div>

    <div class="box">
      <div class="muted" style="font-weight:600; margin-bottom:6px;">1. Selected Retailer Garment</div>
      ${
        selectedProduct
          ? `
        <img class="preview" src="${escapeHtml(selectedProduct.imageUrl)}" alt="Selected Garment" />
        <div style="font-size:12px; font-weight:600; margin-top:6px;">${escapeHtml(selectedProduct.title || 'External Garment')}</div>
        <div class="muted">${escapeHtml(selectedProduct.retailerDomain)}</div>
      `
          : `<div class="muted">No garment selected yet. Use the VestiAI popup to scan a product page.</div>`
      }
    </div>

    <div class="box">
      <div class="muted" style="font-weight:600; margin-bottom:6px;">2. Your Portrait Photo & Consent</div>
      <input id="person-file" type="file" accept="image/jpeg,image/png,image/webp" />
      <label style="display:flex; gap:8px; align-items:flex-start; margin-top:8px; font-size:11px; color:#525252;">
        <input id="consent-box" type="checkbox" ${consentChecked ? 'checked' : ''} />
        <span>I consent to private 2D AI try-on synthesis for this photograph.</span>
      </label>
    </div>

    <button id="submit-btn" class="btn btn-accent" type="button" ${
      !selectedProduct || !personFile || !consentChecked || !accessToken || isBusy ? 'disabled' : ''
    }>
      ${isBusy ? 'Processing AI Try-On...' : 'Generate 2D Try-On'}
    </button>

    <div class="box" style="margin-top:12px;">
      <div class="muted">${escapeHtml(statusText)}</div>
      ${
        resultUrl
          ? `
        <img class="preview" style="margin-top:8px;" src="${escapeHtml(resultUrl)}" alt="Generated Try-On Result" />
        <button id="save-look-btn" class="btn btn-outline" style="width:100%; margin-top:8px;" type="button">
          Save Result to My Looks
        </button>
      `
          : ''
      }
    </div>
  `;

  document.getElementById('person-file')?.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    personFile = input.files?.[0] || null;
    render();
  });

  document.getElementById('consent-box')?.addEventListener('change', (e) => {
    consentChecked = (e.target as HTMLInputElement).checked;
    render();
  });

  document.getElementById('submit-btn')?.addEventListener('click', async () => {
    if (!selectedProduct || !personFile || !consentChecked || !accessToken) return;
    isBusy = true;
    resultUrl = null;
    statusText = 'Fetching garment image and submitting try-on job...';
    render();

    try {
      const garmentBlob = await fetchGarmentBlob(selectedProduct.imageUrl);
      const created = await submitExtensionTryOn(apiBaseUrl, accessToken, {
        personFile,
        garmentBlob,
        consent: true,
        retailerUrl: selectedProduct.pageUrl,
        productTitle: selectedProduct.title,
      });
      lastJobId = created.job_id;
      statusText = `Job ${created.job_id} queued. Waiting for AI worker...`;
      render();

      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const job = await getJobStatus(apiBaseUrl, accessToken, created.job_id);
        if (job.status === 'completed' && job.result_url) {
          const origin = new URL(apiBaseUrl).origin;
          resultUrl = job.result_url.startsWith('/') ? `${origin}${job.result_url}` : job.result_url;
          statusText = 'Try-on completed!';
          break;
        }
        if (job.status === 'failed' || job.status === 'cancelled') {
          statusText = job.error_message || `Job ${job.status}.`;
          break;
        }
      }
    } catch (err) {
      statusText = err instanceof Error ? err.message : 'Extension try-on failed.';
    } finally {
      isBusy = false;
      render();
    }
  });

  document.getElementById('save-look-btn')?.addEventListener('click', async () => {
    if (!lastJobId || !accessToken) return;
    try {
      await saveLookToAccount(apiBaseUrl, accessToken, lastJobId);
      statusText = 'Saved to your VestiAI Saved Looks!';
    } catch (err) {
      statusText = err instanceof Error ? err.message : 'Could not save look.';
    }
    render();
  });
}

async function init(): Promise<void> {
  const data = await chrome.storage.local.get(['selectedProduct', 'accessToken', 'apiBaseUrl']);
  selectedProduct = (data.selectedProduct as ExtractedProductContext) || null;
  if (typeof data.accessToken === 'string') accessToken = data.accessToken;
  if (typeof data.apiBaseUrl === 'string') apiBaseUrl = data.apiBaseUrl;
  render();
}

void init();

