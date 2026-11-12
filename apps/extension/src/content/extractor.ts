import type { ExtractedProductContext } from '../types';

const IGNORED_KEYWORDS = ['logo', 'icon', 'avatar', 'sprite', 'favicon', 'badge'];

export function extractVisibleGarmentImages(
  doc: Document,
  pageUrl: string
): ExtractedProductContext[] {
  let domain = '';
  try {
    const parsed = new URL(pageUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return [];
    }
    domain = parsed.hostname;
  } catch {
    return [];
  }

  const ogTitle = doc
    .querySelector('meta[property="og:title"]')
    ?.getAttribute('content')
    ?.trim();
  const h1Title = doc.querySelector('h1')?.textContent?.trim();
  const resolvedTitle = ogTitle || h1Title || doc.title?.trim() || null;

  const seen = new Set<string>();
  const results: ExtractedProductContext[] = [];

  const images = Array.from(doc.querySelectorAll('img'));
  for (const img of images) {
    const rawSrc = img.currentSrc || img.getAttribute('src') || '';
    if (!rawSrc || (!rawSrc.startsWith('http://') && !rawSrc.startsWith('https://'))) {
      continue;
    }

    const alt = (img.getAttribute('alt') || '').trim();
    const lowerCheck = `${rawSrc} ${alt}`.toLowerCase();
    if (IGNORED_KEYWORDS.some((kw) => lowerCheck.includes(kw))) {
      continue;
    }

    const width = img.naturalWidth || img.width || Number(img.getAttribute('width') || 0);
    const height = img.naturalHeight || img.height || Number(img.getAttribute('height') || 0);
    if (width > 0 && width < 160) continue;
    if (height > 0 && height < 160) continue;

    if (seen.has(rawSrc)) continue;
    seen.add(rawSrc);

    results.push({
      imageUrl: rawSrc,
      pageUrl,
      title: resolvedTitle,
      retailerDomain: domain,
      alt: alt || undefined,
    });

    if (results.length >= 12) break;
  }

  return results;
}

