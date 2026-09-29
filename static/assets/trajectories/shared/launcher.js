const card = document.getElementById("trajectory-card");
const parameters = new URLSearchParams(location.search);
if (parameters.has("embed")) {
  document.documentElement.style.background = "transparent";
  document.querySelector(".page").hidden = true;
}

card.addEventListener("click", async () => {
  card.disabled = true;
  card.classList.add("loading");
  let viewer;
  try {
    viewer = await import("./viewer.js");
  } catch (error) {
    if (parameters.has("embed")) {
      window.parent.postMessage("trajectory-viewer-error", location.origin);
    }
    throw error;
  }
  card.classList.remove("loading");
  card.disabled = false;
  viewer.openViewer();
  if (parameters.has("embed")) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.parent.postMessage("trajectory-viewer-ready", location.origin);
    }));
  }
});

if (parameters.has("backdrop")) card.click();
