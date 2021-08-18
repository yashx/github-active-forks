document
  .getElementById("options-form")
  .addEventListener("submit", optionSubmit);

chrome.storage.local.get("options", ({ options }) => {
  document.getElementById("display_count").value = options.display_count;
  document.getElementById("sort_mode").value = options.sort_mode;
});

function optionSubmit(e) {
  e.preventDefault();
  chrome.storage.local.set({
    options: {
      display_count: +e.target.elements["display_count"].value,
      sort_mode: e.target.elements["sort_mode"].value,
    },
  });
  window.close();
}
