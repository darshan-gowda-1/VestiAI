chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'SET_SELECTED_PRODUCT') {
    chrome.storage.local.set({ selectedProduct: message.payload }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message?.type === 'GET_SELECTED_PRODUCT') {
    chrome.storage.local.get(['selectedProduct'], (data) => {
      sendResponse({ ok: true, product: data.selectedProduct ?? null });
    });
    return true;
  }

  if (message?.type === 'OPEN_SIDEPANEL' && message.windowId) {
    chrome.sidePanel?.open?.({ windowId: message.windowId }).catch(() => {});
    sendResponse({ ok: true });
    return false;
  }

  return false;
});

