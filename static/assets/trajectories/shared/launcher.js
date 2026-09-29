const card = document.getElementById("trajectory-card");
const parameters = new URLSearchParams(location.search);
if (parameters.has("embed")) {
  document.documentElement.style.background = "transparent";
  document.querySelector(".page").hidden = true;
}

card.addEventListener("click", async () => {
  card.disabled = true;
  card.classList.add("loading");
  const viewer = await import("./viewer.js");
  card.classList.remove("loading");
  card.disabled = false;
  viewer.openViewer();
});

if (parameters.has("backdrop")) card.click();
