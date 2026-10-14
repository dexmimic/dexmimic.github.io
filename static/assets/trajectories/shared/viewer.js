import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { motionBounds, frameMotion, frameConfigured } from "./framing.js?v=20261015-bimanual";
import { createComparison } from "./comparison.js";

const viewport = document.createElement("div");
viewport.className = "scene-viewport";
const overlay = document.getElementById("overlay");
const shell = document.getElementById("viewer-shell");
const loader = new GLTFLoader();
const asset = (name) => new URL(name, import.meta.url).href;
const unitAsset = (name) => new URL(name, document.baseURI).href;
const backdrop =
  new URLSearchParams(location.search).get("backdrop") || document.body.dataset.backdrop || "studio";
const studio = backdrop === "studio";
const [data, handAsset, objectAsset] = await Promise.all([
  fetch(unitAsset("trajectory.json")).then((response) => response.json()),
  loader.loadAsync(unitAsset(document.body.dataset.handAsset)),
  loader.loadAsync(unitAsset("object.glb")),
]);

const cameraConfig = document.body.dataset.cameraConfig
  ? await fetch(unitAsset(document.body.dataset.cameraConfig)).then((response) => response.json()) : null;

const scene = new THREE.Scene();
scene.background = studio ? new THREE.Color("#ffffff") : null;
const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 20);
camera.up.set(0, 0, 1);
camera.position.set(0.85, -1.15, 1.05);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.transmissionResolutionScale = 0.5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

const room = new RoomEnvironment();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(room, 0.04).texture;
scene.environmentIntensity = 0.45;
scene.environmentRotation.x = Math.PI / 2;
room.dispose();
pmrem.dispose();

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0.28);
controls.enableDamping = true;
controls.minDistance = 0.32;
controls.maxDistance = 2.4;
controls.enabled = false;
controls.update();

scene.add(new THREE.HemisphereLight("#ffffff", "#c0c4ce", 0.25));
const keyLight = new THREE.DirectionalLight("#fffaf4", 1.2);
keyLight.position.set(-0.55, -0.55, 1.4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -1;
keyLight.shadow.camera.right = 1;
keyLight.shadow.camera.top = 1;
keyLight.shadow.camera.bottom = -1;
keyLight.shadow.bias = -0.0002;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight("#f2f5fa", 0.3);
fillLight.position.set(0.6, 0.55, 0.9);
scene.add(fillLight);

const furniture = new THREE.Group();
furniture.name = "furniture";
furniture.visible = !studio;
scene.add(furniture);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.ShadowMaterial({ color: "#66747a", opacity: 0.05 }),
);
floor.position.z = -0.005;
floor.receiveShadow = true;
furniture.add(floor);

const tableTop = new THREE.Mesh(
  new THREE.BoxGeometry(0.4, 0.6, 0.03),
  new THREE.MeshStandardMaterial({
    color: "#d8d3cb",
    roughness: 0.77,
    metalness: 0.04,
  }),
);
tableTop.position.z = 0.4;
tableTop.castShadow = true;
tableTop.receiveShadow = true;
furniture.add(tableTop);
const legGeometry = new THREE.BoxGeometry(0.021, 0.021, 0.385);
const legMaterial = new THREE.MeshStandardMaterial({
  color: "#89949a",
  roughness: 0.66,
  metalness: 0.22,
});
for (const x of [-0.17, 0.17]) {
  for (const y of [-0.27, 0.27]) {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(x, y, 0.193);
    leg.castShadow = true;
    furniture.add(leg);
  }
}

const referenceHandMaterial = new THREE.MeshStandardMaterial({
  color: "#b66cc8",
  transparent: true,
  opacity: 0.6,
  roughness: 0.35,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const referenceObjectMaterial = new THREE.MeshStandardMaterial({
  color: "#efa06a",
  transparent: true,
  opacity: 0.6,
  roughness: 0.38,
  depthWrite: false,
  side: THREE.DoubleSide,
});

function styleModel(root, material) {
  root.traverse((node) => {
    if (node.isMesh) {
      if (material) node.material = material;
      node.castShadow = !node.material.transparent && !(node.material.transmission > 0);
      node.receiveShadow = !node.material.transparent;
    }
  });
  scene.add(root);
  return root;
}

const hand = styleModel(handAsset.scene);
const referenceHand = styleModel(
  handAsset.scene.clone(true),
  referenceHandMaterial,
);
const object = styleModel(objectAsset.scene);
const referenceObject = styleModel(
  objectAsset.scene.clone(true),
  referenceObjectMaterial,
);
const handLinks = data.links.map((name) => hand.getObjectByName(name));
const referenceLinks = data.links.map((name) =>
  referenceHand.getObjectByName(name),
);
const objectLinks = data.object_links
  ? data.object_links.map((name) => object.getObjectByName(name)) : [object];
const referenceObjectLinks = data.object_links
  ? data.object_links.map((name) => referenceObject.getObjectByName(name)) : [referenceObject];
if (handLinks.some((node) => !node) || referenceLinks.some((node) => !node)) {
  throw new Error("Hand GLB link names do not match trajectory.json");
}
const bounds = studio ? motionBounds(data, handLinks, objectLinks) : null;

function makePath(points, color, opacity) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point)),
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(
      curve,
      Math.max(24, points.length * 2),
      0.0018,
      6,
      false,
    ),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  );
  return mesh;
}

function makePaths(paths, color, opacity) {
  const group = new THREE.Group();
  paths.forEach((points) => group.add(makePath(points, color, opacity)));
  scene.add(group);
  return group;
}

const layers = {
  hand,
  object,
  handPath: makePaths(data.hand_paths ?? [data.hand_path], "#5f9dcc", 0.78),
  objectPath: makePaths(data.object_paths ?? [data.object_path], "#60b781", 0.9),
  referenceHand,
  referenceObject,
  referenceHandPath: makePaths(data.reference_hand_paths ?? [data.reference_hand_path], "#a354bb", 0.82),
  referenceObjectPath: makePaths(data.reference_object_paths ?? [data.reference_object_path], "#ce7540", 0.86),
};
let comparing = true;
function syncLayers() {
  document.querySelectorAll("[data-layer]").forEach((input) => {
    const key = input.dataset.layer;
    layers[key].visible = comparing ? key === "hand" || key === "object" : input.checked;
  });
}
document.querySelectorAll("[data-layer]").forEach((input) => input.addEventListener("change", syncLayers));

viewport.style.backgroundImage =
  backdrop === "studio"
    ? "none"
    : `linear-gradient(180deg, rgba(245, 248, 249, .68), rgba(245, 248, 249, .58)), url("${asset(`backgrounds/${backdrop}.webp`)}")`;

const positionA = new THREE.Vector3();
const positionB = new THREE.Vector3();
const quaternionA = new THREE.Quaternion();
const quaternionB = new THREE.Quaternion();
function updateLink(node, a, b, alpha) {
  positionA.fromArray(a, 0);
  positionB.fromArray(b, 0);
  node.position.copy(positionA).lerp(positionB, alpha);
  quaternionA.fromArray(a, 3);
  quaternionB.fromArray(b, 3);
  node.quaternion.copy(quaternionA).slerp(quaternionB, alpha);
}

function updateObject(node, a, b, alpha) {
  positionA.fromArray(a[0]);
  positionB.fromArray(b[0]);
  node.position.copy(positionA).lerp(positionB, alpha);
  quaternionA.fromArray(a[1]);
  quaternionB.fromArray(b[1]);
  node.quaternion.copy(quaternionA).slerp(quaternionB, alpha);
}

const comparison = await createComparison({
  scene, renderer, camera, viewport, shell, object, objectLinks, updateObject,
  onModeChange: (value) => { comparing = value; syncLayers(); },
  onDrag: (dragging) => { controls.enabled = open && !dragging; },
});
if (studio) bounds.union(comparison.bounds);

const rewards = data.reward;
const rewardMin = Math.min(...rewards) - 0.5;
const rewardRange = Math.max(...rewards) - rewardMin + 0.5;
const rewardPoints = rewards
  .map(
    (value, i) =>
      `${(i * 600) / (rewards.length - 1)},${55 - ((value - rewardMin) * 51) / rewardRange}`,
  )
  .join(" L ");
document.getElementById("reward-line").setAttribute("d", `M ${rewardPoints}`);
document
  .getElementById("reward-fill")
  .setAttribute("d", `M 0,58 L ${rewardPoints} L 600,58 Z`);

const timeline = document.getElementById("timeline");
const timeText = document.getElementById("current-time");
const rewardValue = document.getElementById("reward-value");
const rewardCursor = document.getElementById("reward-cursor");
const playButton = document.getElementById("play-button");
const speedSelect = document.getElementById("speed");
document.getElementById("duration").textContent =
  `${data.duration.toFixed(1)}s`;
let time = 0;
let playing = false;
let open = false;

export function setTime(seconds) {
  time = Math.min(Math.max(seconds, 0), data.duration);
  const index = Math.min(Math.floor(time * data.fps), data.frame_count - 2);
  const first = data.frames[index];
  const next = data.frames[index + 1];
  const alpha = THREE.MathUtils.clamp(
    (time - first.time) / (next.time - first.time),
    0,
    1,
  );
  const objectA = data.object_links ? first.object : [first.object];
  const objectB = data.object_links ? next.object : [next.object];
  const referenceA = data.object_links ? first.reference_object : [first.reference_object];
  const referenceB = data.object_links ? next.reference_object : [next.reference_object];
  objectLinks.forEach((node, j) => updateObject(node, objectA[j], objectB[j], alpha));
  referenceObjectLinks.forEach((node, j) => updateObject(node, referenceA[j], referenceB[j], alpha));
  for (let j = 0; j < handLinks.length; j++) {
    updateLink(handLinks[j], first.hand[j], next.hand[j], alpha);
    updateLink(
      referenceLinks[j],
      first.reference_hand[j],
      next.reference_hand[j],
      alpha,
    );
  }
  comparison.setFrame(index, alpha);
  timeline.value = Math.round((1000 * time) / data.duration);
  timeText.textContent = `${time.toFixed(1)}s`;
  rewardValue.textContent = rewards[index].toFixed(2);
  const cursorX = ((index + alpha) * 600) / (data.frame_count - 1);
  rewardCursor.setAttribute("x1", cursorX);
  rewardCursor.setAttribute("x2", cursorX);
}

export function renderTime(seconds, side = "compare") {
  setTime(seconds);
  comparison.render(side);
}

function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  if (width && height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (studio) {
      if (cameraConfig) frameConfigured(camera, controls, cameraConfig);
      else frameMotion(camera, controls, bounds);
    }
  }
}
new ResizeObserver(resize).observe(viewport);

function togglePlayback(value) {
  playing = value;
  playButton.textContent = playing ? "Ⅱ" : "▶";
  playButton.setAttribute("aria-label", playing ? "Pause" : "Play");
}

export function openViewer() {
  document.getElementById("expanded-stage").appendChild(viewport);
  overlay.hidden = false;
  open = true;
  shell.focus();
  controls.enabled = true;
  togglePlayback(true);
  resize();
  animate();
}

function closeViewer() {
  viewport.remove();
  overlay.hidden = true;
  overlay.classList.remove("full");
  shell.classList.remove("full");
  document.getElementById("size-button").textContent = "FULL SCREEN ↗";
  open = false;
  controls.enabled = false;
  togglePlayback(false);
  setTime(0);
  resize();
  if (new URLSearchParams(location.search).has("embed")) {
    window.parent.postMessage("trajectory-viewer-close", location.origin);
  } else if (document.body.dataset.collectionUrl) {
    location.assign(document.body.dataset.collectionUrl);
  }
}

document.getElementById("close-button").addEventListener("click", closeViewer);
document.getElementById("size-button").addEventListener("click", () => {
  const full = shell.classList.toggle("full");
  overlay.classList.toggle("full", full);
  document.getElementById("size-button").textContent = full
    ? "HALF SCREEN ↙"
    : "FULL SCREEN ↗";
  resize();
});
playButton.addEventListener("click", () => togglePlayback(!playing));
timeline.addEventListener("input", () =>
  setTime((Number(timeline.value) * data.duration) / 1000),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && open) closeViewer();
  if (event.code === "Space" && open && !event.target.closest('input, select, button, [role="slider"]')) {
    event.preventDefault();
    togglePlayback(!playing);
  }
});
overlay.addEventListener("click", (event) => {
  if (event.target === overlay) closeViewer();
});

setTime(0);
const clock = new THREE.Clock();
function animate() {
  if (!open) return;
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  if (playing && open)
    setTime((time + delta * Number(speedSelect.value)) % data.duration);
  controls.update();
  comparison.render();
}
