chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    options: { display_count: 5, sort_mode: "stars" },
  });
});
