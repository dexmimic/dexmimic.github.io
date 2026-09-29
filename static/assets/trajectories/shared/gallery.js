let frame;
let activeCard;
const gallery = document.querySelector(".page");

function closePreview() {
  frame.remove();
  frame = null;
  gallery.inert = false;
  document.body.style.overflow = "";
  activeCard.focus({ preventScroll: true });
}

document.querySelectorAll(".trajectory-card").forEach((card) => {
  card.addEventListener("click", (event) => {
    event.preventDefault();
    activeCard = card;
    frame = document.createElement("iframe");
    frame.id = "unit-frame";
    frame.title = card.querySelector(".task-id").textContent;
    frame.src = `${card.href}&embed=1`;
    document.body.appendChild(frame);
    gallery.inert = true;
    document.body.style.overflow = "hidden";
  });
});

window.addEventListener("message", (event) => {
  if (event.origin === location.origin && event.source === frame?.contentWindow &&
      event.data === "trajectory-viewer-close") {
    closePreview();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && frame) closePreview();
});
