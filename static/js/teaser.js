import { createCurtain } from "../assets/trajectories/shared/curtain.js?v=20261011-title-boundary";

const hero = document.querySelector(".teaser");
const video = hero.querySelector(".teaser-video");
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const assets = new URL("../assets/teaser/", import.meta.url);
let visible = false;
let preparation;
let updatePlayback = () => {};

function titleBoundaryFraction() {
  const bounds = hero.getBoundingClientRect();
  return (hero.querySelector(".teaser-name .mimic").getBoundingClientRect().left - bounds.left) / bounds.width;
}

function matrixLayout(atlas) {
  const bounds = hero.getBoundingClientRect();
  const links = hero.querySelector(".teaser-resource-links").getBoundingClientRect();
  const nav = hero.querySelector(".teaser-nav").getBoundingClientRect();
  const { width, height } = bounds;
  const columns = width < 640 ? 4 : width < 1024 ? 5 : 7;
  const rows = Math.ceil(atlas.units.length / columns);
  const gap = width < 640 ? 5 : 12;
  const edge = width < 640 ? 10 : 22;
  const top = links.bottom - bounds.top + 12;
  const bottom = nav.top - bounds.top - 12;
  const cellWidth = (width - edge * 2 - gap * (columns - 1)) / columns;
  const cellHeight = (bottom - top - gap * (rows - 1)) / rows;
  const size = Math.min(cellWidth, cellHeight);
  const tiles = atlas.units.map((unit, index) => {
    const row = Math.floor(index / columns);
    const rowCount = Math.min(columns, atlas.units.length - row * columns);
    const rowOffset = (columns - rowCount) * (cellWidth + gap) / 2;
    const crop = unit.crop;
    const scale = size / Math.max(crop[2], crop[3]);
    const tileWidth = crop[2] * scale;
    const tileHeight = crop[3] * scale;
    return { index, crop,
      x: edge + rowOffset + (index % columns) * (cellWidth + gap) + (cellWidth - tileWidth) / 2,
      y: top + row * (cellHeight + gap) + (cellHeight - tileHeight) / 2,
      width: tileWidth, height: tileHeight };
  });
  return { width, height, tiles };
}

function drawTiles(context, source, atlas, layout, side) {
  layout.tiles.forEach(({ index, crop, x, y, width, height }) => {
    context.drawImage(source,
      (index % atlas.columns + crop[0]) * atlas.tile_size,
      (Math.floor(index / atlas.columns) + crop[1]) * atlas.tile_size + (side === 0 ? atlas.human_y : atlas.simulation_y),
      crop[2] * atlas.tile_size, crop[3] * atlas.tile_size,
      x, y, width, height);
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
  video.addEventListener("loadeddata", () => { setSource(video); draw(); updatePlayback(); });
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
      video.src = new URL("comparison.mp4?v=20261015-matrix35", assets);
      video.load();
    }
    if (playing) video.play().catch((error) => {
      if (error.name !== "AbortError") throw error;
    });
    else video.pause();
    if (motion.matches) { setSource(poster); draw(); }
    const ready = motion.matches || video.readyState >= 2;
    hero.querySelector(".teaser-loading").hidden = ready;
    hero.setAttribute("aria-busy", String(!ready));
    if (!playing) curtain.cancelCue(true);
    if (playing && ready && !cueShown) {
      cueShown = true;
      curtain.playCue();
    }
  };
}

async function prepareTeaser() {
  const atlas = await fetch(new URL("atlas.json?v=20261015-matrix35", assets)).then((response) => response.json());
  const poster = new Image();
  poster.src = new URL("comparison-poster.jpg?v=20261015-matrix35", assets);
  await poster.decode();
  const canvas = hero.querySelector(".teaser-matrix");
  const context = canvas.getContext("2d");
  let source = poster;
  let fraction = titleBoundaryFraction();
  let layout;
  const draw = () => drawComparison(context, source, atlas, layout, fraction);
  const resize = () => {
    layout = matrixLayout(atlas);
    const ratio = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(layout.width * ratio);
    canvas.height = Math.round(layout.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const copyTop = hero.querySelector(".teaser-copy").getBoundingClientRect().top - hero.getBoundingClientRect().top;
    hero.style.setProperty("--grip-top", `${copyTop - 80 - 30}px`);
    draw();
  };
  resize();
  const curtain = createCurtain(hero, () => {}, (value) => { fraction = value; draw(); }, fraction);
  const resizeObserver = new ResizeObserver(() => {
    resize();
    curtain.setRestingFraction(titleBoundaryFraction());
  });
  resizeObserver.observe(hero);
  resizeObserver.observe(hero.querySelector(".teaser-copy"));
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
