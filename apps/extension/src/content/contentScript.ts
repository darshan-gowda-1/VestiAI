import { extractVisibleGarmentImages } from './extractor';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'SCAN_PAGE_PRODUCTS') {
    const items = extractVisibleGarmentImages(document, window.location.href);
    sendResponse({ ok: true, items });
  }
  return false;
});

