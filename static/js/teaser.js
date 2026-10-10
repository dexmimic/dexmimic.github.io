import { createCurtain } from "../assets/trajectories/shared/curtain.js?v=20261011-smooth-cues";

const hero = document.querySelector(".teaser");
const video = hero.querySelector(".teaser-video");
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const assets = new URL("../assets/teaser/", import.meta.url);
let visible = false;
let preparation;
let updatePlayback = () => {};

function matrixLayout(count) {
  const { width, height } = hero.getBoundingClientRect();
  const columns = width >= 1024 ? 7 : width >= 640 ? 5 : 4;
  const rows = Math.ceil(count / columns);
  const gap = width < 640 ? 6 : 12;
  const padding = width < 640 ? 18 : 32;
  const tile = Math.min((width - padding * 2 - gap * (columns - 1)) / columns,
    (height - 154 - gap * (rows - 1)) / rows);
  return {
    width, height, columns, tile, step: tile + gap,
    left: (width - columns * tile - gap * (columns - 1)) / 2,
    top: (height - rows * tile - gap * (rows - 1)) / 2,
  };
}

function drawTiles(context, source, atlas, layout, side) {
  atlas.units.forEach((_, index) => {
    const row = Math.floor(index / layout.columns);
    const rowCount = Math.min(layout.columns, atlas.units.length - row * layout.columns);
    const left = layout.left + (layout.columns - rowCount) * layout.step / 2;
    context.drawImage(source,
      (index % atlas.columns) * atlas.tile_size,
      Math.floor(index / atlas.columns) * atlas.tile_size + (side === 0 ? atlas.human_y : atlas.simulation_y),
      atlas.tile_size, atlas.tile_size,
      left + (index % layout.columns) * layout.step,
      layout.top + row * layout.step, layout.tile, layout.tile);
  });
}

function drawComparison(context, source, atlas, layout, fraction) {
  context.clearRect(0, 0, layout.width, layout.height);
  drawTiles(context, source, atlas, layout, 1);
  context.save();
  context.beginPath();
  context.rect(0, 0, layout.width * fraction, layout.height);
  context.clip();
  drawTiles(context, source, atlas, layout, 0);
  context.restore();
}

function connectVideo(draw, setSource) {
  video.addEventListener("loadeddata", () => { setSource(video); draw(); });
  function frame() {
    setSource(video);
    draw();
    video.requestVideoFrameCallback(frame);
  }
  video.requestVideoFrameCallback(frame);
}

function makePlayback(poster, draw, setSource, curtain) {
  let started = false;
  let cueShown = false;
  return () => {
    const playing = visible && !document.hidden && !motion.matches;
    if (playing && !started) {
      started = true;
      video.src = new URL("comparison.mp4", assets);
      video.load();
    }
    if (playing) video.play().catch((error) => {
      if (error.name !== "AbortError") throw error;
    });
    else video.pause();
    if (motion.matches) { setSource(poster); draw(); }
    if (!playing) curtain.cancelCue(true);
    if (playing && !cueShown) {
      cueShown = true;
      curtain.playCue();
    }
  };
}

async function prepareTeaser() {
  const atlas = await fetch(new URL("atlas.json", assets)).then((response) => response.json());
  const poster = new Image();
  poster.src = new URL("comparison-poster.jpg", assets);
  await poster.decode();
  const canvas = hero.querySelector(".teaser-matrix");
  const context = canvas.getContext("2d");
  let source = poster;
  let fraction = 0.5;
  let layout;
  const draw = () => drawComparison(context, source, atlas, layout, fraction);
  const resize = () => {
    layout = matrixLayout(atlas.units.length);
    const ratio = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(layout.width * ratio);
    canvas.height = Math.round(layout.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const copyTop = hero.querySelector(".teaser-copy").getBoundingClientRect().top - hero.getBoundingClientRect().top;
    hero.style.setProperty("--grip-top", `${copyTop - 80 - 30}px`);
    draw();
  };
  resize();
  new ResizeObserver(resize).observe(hero);
  const curtain = createCurtain(hero, () => {}, (value) => { fraction = value; draw(); });
  const setSource = (value) => { source = motion.matches ? poster : value; };
  connectVideo(draw, setSource);
  updatePlayback = makePlayback(poster, draw, setSource, curtain);
  updatePlayback();
}

motion.addEventListener("change", () => updatePlayback());
document.addEventListener("visibilitychange", () => updatePlayback());
new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  if (visible && !preparation) preparation = prepareTeaser();
  updatePlayback();
}, { threshold: 0.05 }).observe(hero);
