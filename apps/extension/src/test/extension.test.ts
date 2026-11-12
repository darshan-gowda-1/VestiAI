import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractVisibleGarmentImages } from '../content/extractor';
import {
  fetchGarmentBlob,
  registerProductContext,
  verifyExtensionSession,
} from '../services/apiClient';

describe('VestiAI 2.0 Chrome Extension', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('extracts valid product images and ignores logos/icons/tiny images', () => {
    document.body.innerHTML = `
      <html>
        <head><meta property="og:title" content="Classic Linen Shirt" /></head>
        <body>
          <img src="https://shop.example.com/assets/site-logo.png" width="300" height="300" alt="Brand Logo" />
          <img src="https://shop.example.com/assets/tiny.jpg" width="40" height="40" alt="Swatch" />
          <img src="https://shop.example.com/products/linen-shirt.jpg" width="600" height="800" alt="Linen Shirt Front" />
        </body>
      </html>
    `;

    const items = extractVisibleGarmentImages(
      document,
      'https://shop.example.com/products/classic-linen-shirt'
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      imageUrl: 'https://shop.example.com/products/linen-shirt.jpg',
      pageUrl: 'https://shop.example.com/products/classic-linen-shirt',
      title: 'Classic Linen Shirt',
      retailerDomain: 'shop.example.com',
      alt: 'Linen Shirt Front',
    });
  });

  it('returns empty array on unsupported non-http pages', () => {
    document.body.innerHTML = `<img src="https://example.com/shirt.jpg" width="400" height="400" />`;
    expect(extractVisibleGarmentImages(document, 'chrome://extensions')).toEqual([]);
  });

  it('verifies extension session, registers product context, and handles CORS image blocks', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, user: { email: 'user@example.com' } }),
      })
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    vi.stubGlobal('fetch', fetchMock);

    const session = await verifyExtensionSession('http://localhost:8000/api/v1', 'jwt-token');
    expect(session.authenticated).toBe(true);

    await registerProductContext('http://localhost:8000/api/v1', 'jwt-token', {
      imageUrl: 'https://shop.example.com/shirt.jpg',
      pageUrl: 'https://shop.example.com/item',
      title: 'Oxford Shirt',
      retailerDomain: 'shop.example.com',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await expect(fetchGarmentBlob('https://blocked-cdn.example.com/shirt.jpg')).rejects.toThrow(
      /blocks direct cross-origin image access/i
    );
  });
});

