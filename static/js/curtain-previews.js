import { createCurtain } from "../assets/trajectories/shared/curtain.js?v=20261011-smooth-cues";

const cards = [...document.querySelectorAll(".trajectory-card")];
const previews = new Map();
const preparing = new Map();
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let cueSeen = false;
let cueInterrupted = false;
let galleryVisible = false;

function interruptGalleryCue() {
  if (!cueSeen) return;
  cueInterrupted = true;
  previews.forEach((curtain) => curtain.cancelCue(true));
}

async function startGalleryCue() {
  if (cueSeen || !galleryVisible || document.hidden) return;
  cueSeen = true;
  if (reducedMotion.matches) cueInterrupted = true;
  const visibleCards = cards.filter((card) => {
    const bounds = card.getBoundingClientRect();
    return bounds.width && bounds.top < window.innerHeight && bounds.bottom > 0;
  });
  const curtains = await Promise.all(visibleCards.map(preparePreview));
  if (cueInterrupted || !galleryVisible || document.hidden || reducedMotion.matches) return;
  const startedAt = performance.now();
  curtains.forEach((curtain) => curtain.playCue(startedAt));
}

function preparePreview(card) {
  if (!preparing.has(card)) preparing.set(card, createPreview(card));
  return preparing.get(card);
}

function drawComparison(context, source, fraction, crop) {
  const width = context.canvas.width;
  const height = context.canvas.height;
  const video = source instanceof HTMLVideoElement;
  const sourceWidth = (video ? source.videoWidth : source.naturalWidth) / 2;
  const sourceHeight = video ? source.videoHeight : source.naturalHeight;
  const target = [crop.left * width, crop.top * height, crop.scale * width, crop.scale * height];
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, sourceWidth, 0, sourceWidth, sourceHeight, ...target);
  context.save();
  context.beginPath();
  context.rect(0, 0, fraction * width, height);
  context.clip();
  context.drawImage(source, 0, 0, sourceWidth, sourceHeight, ...target);
  context.restore();
}

async function createPreview(card) {
  const preview = card.querySelector(".trajectory-preview");
  const video = preview.querySelector("video");
  const directory = new URL(".", card.href);
  const poster = new Image();
  poster.src = new URL("comparison-poster.png", directory);
  await poster.decode();
  const canvas = document.createElement("canvas");
  canvas.className = "comparison-preview";
  canvas.width = canvas.height = 640;
  canvas.setAttribute("aria-hidden", "true");
  preview.appendChild(canvas);
  const context = canvas.getContext("2d");
  const style = getComputedStyle(preview);
  const crop = {
    scale: parseFloat(style.getPropertyValue("--preview-size")) / 100,
    left: parseFloat(style.getPropertyValue("--preview-left")) / 100,
    top: parseFloat(style.getPropertyValue("--preview-top")) / 100,
  };
  let source = poster;
  let fraction = 0;
  const draw = () => drawComparison(context, source, fraction, crop);
  const wrapper = document.createElement("div");
  wrapper.className = "trajectory-unit";
  card.before(wrapper);
  wrapper.appendChild(card);
  const control = document.createElement("div");
  control.className = "curtain-card-controls";
  control.innerHTML = '<div class="comparison-labels"><span>MANO</span><span>Wuji</span></div>';
  wrapper.appendChild(control);
  const curtain = createCurtain(control, () => {}, (value) => { fraction = value; draw(); }, 0);
  curtain.divider.setAttribute("aria-label", `Compare ${card.querySelector(".trajectory-name").textContent}: Human and Wuji`);
  previews.set(card, curtain);
  card.classList.add("has-curtain");
  video.addEventListener("loadeddata", () => { source = video; draw(); });
  const paintFrame = () => {
    source = video;
    draw();
    video.requestVideoFrameCallback(paintFrame);
  };
  video.requestVideoFrameCallback(paintFrame);
  video.dataset.src = new URL("comparison.mp4", directory).href;
  if (video.hasAttribute("src")) video.src = video.dataset.src;
  return curtain;
}

const observer = new IntersectionObserver((entries) => {
  entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
    observer.unobserve(entry.target);
    preparePreview(entry.target);
  });
}, { rootMargin: "120px 0px" });
cards.forEach((card) => observer.observe(card));

const galleryObserver = new IntersectionObserver(([entry]) => {
  galleryVisible = entry.isIntersecting && entry.intersectionRatio >= 0.1;
  if (galleryVisible) startGalleryCue();
  else interruptGalleryCue();
}, { threshold: 0.1 });
galleryObserver.observe(document.getElementById("simulation-grid"));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) interruptGalleryCue();
  else startGalleryCue();
});
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) interruptGalleryCue();
});
