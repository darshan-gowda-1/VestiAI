import {
  DEFAULT_API_BASE_URL,
  DEFAULT_WEB_APP_URL,
  registerProductContext,
  verifyExtensionSession,
} from '../services/apiClient';
import type { ExtractedProductContext } from '../types';

const appEl = document.getElementById('app');

interface PopupState {
  apiBaseUrl: string;
  webAppUrl: string;
  accessToken: string;
  userEmail: string | null;
  items: ExtractedProductContext[];
  selectedIndex: number;
  statusMessage: string;
}

const state: PopupState = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
  webAppUrl: DEFAULT_WEB_APP_URL,
  accessToken: '',
  userEmail: null,
  items: [],
  selectedIndex: -1,
  statusMessage: 'Click "Scan Page" on a supported product page to pick a garment image.',
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function render(): void {
  if (!appEl) return;
  const selected = state.selectedIndex >= 0 ? state.items[state.selectedIndex] : null;

  appEl.innerHTML = `
    <div class="header">
      <div class="brand">Vesti<span class="accent">AI</span> <span class="muted">Extension</span></div>
      <button id="open-web-btn" class="btn btn-outline" type="button">Open VestiAI</button>
    </div>

    <div style="margin-bottom: 10px;">
      <div class="muted" style="margin-bottom:4px;">
        Account: <strong>${state.userEmail ? escapeHtml(state.userEmail) : 'Not connected'}</strong>
      </div>
      <input id="token-input" type="password" placeholder="Paste VestiAI Bearer JWT token" value="${escapeHtml(state.accessToken)}" />
      <input id="api-input" type="url" placeholder="API Base URL" value="${escapeHtml(state.apiBaseUrl)}" />
      <div class="row">
        <button id="save-session-btn" class="btn btn-outline" type="button">Connect Account</button>
        <button id="scan-btn" class="btn" type="button">Scan Page</button>
      </div>
    </div>

    ${
      state.items.length > 0
        ? `<div class="grid">
            ${state.items
              .map(
                (item, idx) => `
              <div class="card ${idx === state.selectedIndex ? 'selected' : ''}" data-idx="${idx}">
                <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.alt || 'Garment')}" />
                <div class="muted" style="margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                  ${escapeHtml(item.alt || item.retailerDomain)}
                </div>
              </div>`
              )
              .join('')}
          </div>`
        : ''
    }

    <div class="row">
      <button id="start-tryon-btn" class="btn btn-accent" type="button" ${!selected ? 'disabled' : ''}>
        Start Try-On in Side Panel
      </button>
      <button id="help-btn" class="btn btn-outline" type="button">Help</button>
    </div>

    <div class="status">${escapeHtml(state.statusMessage)}</div>
  `;

  document.getElementById('open-web-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${state.webAppUrl}/try-on` });
  });

  document.getElementById('help-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${state.webAppUrl}/#how-it-works` });
  });

  document.getElementById('save-session-btn')?.addEventListener('click', async () => {
    const tokenEl = document.getElementById('token-input') as HTMLInputElement | null;
    const apiEl = document.getElementById('api-input') as HTMLInputElement | null;
    state.accessToken = tokenEl?.value.trim() || '';
    state.apiBaseUrl = apiEl?.value.trim() || DEFAULT_API_BASE_URL;
    await chrome.storage.local.set({ accessToken: state.accessToken, apiBaseUrl: state.apiBaseUrl });

    if (!state.accessToken) {
      state.userEmail = null;
      state.statusMessage = 'Token cleared.';
      render();
      return;
    }

    try {
      const session = await verifyExtensionSession(state.apiBaseUrl, state.accessToken);
      state.userEmail = session.user?.email || 'Connected';
      state.statusMessage = 'Connected to VestiAI account.';
    } catch (err) {
      state.userEmail = null;
      state.statusMessage = err instanceof Error ? err.message : 'Unable to verify session.';
    }
    render();
  });

  document.getElementById('scan-btn')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      state.statusMessage = 'No active tab detected.';
      render();
      return;
    }
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
      });
      const resp = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE_PRODUCTS' });
      const items: ExtractedProductContext[] = resp?.items || [];
      state.items = items;
      state.selectedIndex = items.length > 0 ? 0 : -1;
      state.statusMessage =
        items.length > 0
          ? `Found ${items.length} product image(s). Select one and click Start Try-On.`
          : 'No compatible product images found on this page.';
    } catch {
      state.statusMessage = 'Product extraction is not supported on this page (e.g., chrome:// or restricted site).';
    }
    render();
  });

  document.querySelectorAll('.card[data-idx]').forEach((card) => {
    card.addEventListener('click', () => {
      const idx = Number((card as HTMLElement).dataset.idx);
      if (!Number.isNaN(idx)) {
        state.selectedIndex = idx;
        render();
      }
    });
  });

  document.getElementById('start-tryon-btn')?.addEventListener('click', async () => {
    if (!selected) return;
    await chrome.storage.local.set({ selectedProduct: selected });
    if (state.accessToken) {
      try {
        await registerProductContext(state.apiBaseUrl, state.accessToken, selected);
      } catch {
        // Non-fatal: sidepanel will still have selectedProduct locally
      }
    }
    const win = await chrome.windows.getCurrent();
    if (win.id && chrome.sidePanel?.open) {
      await chrome.sidePanel.open({ windowId: win.id });
    }
    state.statusMessage = 'Selected garment sent to VestiAI Side Panel.';
    render();
  });
}

async function init(): Promise<void> {
  const stored = await chrome.storage.local.get(['accessToken', 'apiBaseUrl', 'webAppUrl']);
  if (typeof stored.accessToken === 'string') state.accessToken = stored.accessToken;
  if (typeof stored.apiBaseUrl === 'string') state.apiBaseUrl = stored.apiBaseUrl;
  if (typeof stored.webAppUrl === 'string') state.webAppUrl = stored.webAppUrl;
  render();
}

void init();

