import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const viewport = document.createElement("div");
viewport.className = "scene-viewport";
const overlay = document.getElementById("overlay");
const shell = document.getElementById("viewer-shell");
const loader = new GLTFLoader();
const asset = (name) => new URL(name, import.meta.url).href;
const unitAsset = (name) => new URL(name, document.baseURI).href;
const [data, handAsset, objectAsset] = await Promise.all([
  fetch(unitAsset("trajectory.json")).then((response) => response.json()),
  loader.loadAsync(unitAsset(document.body.dataset.handAsset)),
  loader.loadAsync(unitAsset("object.glb")),
]);

const scene = new THREE.Scene();
scene.background = null;
const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 20);
camera.up.set(0, 0, 1);
camera.position.set(0.99, -1.06, 0.8);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0.28);
controls.enableDamping = true;
controls.minDistance = 0.32;
controls.maxDistance = 2.4;
controls.enabled = false;
controls.update();

scene.add(new THREE.HemisphereLight("#ffffff", "#b5c2cc", 1.8));
const keyLight = new THREE.DirectionalLight("#ffffff", 2.2);
keyLight.position.set(-0.55, -0.55, 1.4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -1;
keyLight.shadow.camera.right = 1;
keyLight.shadow.camera.top = 1;
keyLight.shadow.camera.bottom = -1;
keyLight.shadow.bias = -0.0002;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight("#deedf8", 0.8);
fillLight.position.set(0.6, 0.55, 0.9);
scene.add(fillLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.ShadowMaterial({ color: "#66747a", opacity: 0.05 }),
);
floor.position.z = -0.005;
floor.receiveShadow = true;
scene.add(floor);

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
scene.add(tableTop);
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
    scene.add(leg);
  }
}

const handMaterial = new THREE.MeshStandardMaterial({
  color: "#8fc1e6",
  roughness: 0.46,
  metalness: 0.1,
});
const referenceHandMaterial = new THREE.MeshStandardMaterial({
  color: "#b66cc8",
  transparent: true,
  opacity: 0.6,
  roughness: 0.35,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const objectMaterial = new THREE.MeshPhysicalMaterial({
  color: "#9ed9af",
  roughness: 0.38,
  metalness: 0.03,
  clearcoat: 0.28,
  clearcoatRoughness: 0.22,
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
      node.material = material;
      node.castShadow = !material.transparent;
      node.receiveShadow = !material.transparent;
    }
  });
  scene.add(root);
  return root;
}

const hand = styleModel(handAsset.scene, handMaterial);
const referenceHand = styleModel(
  handAsset.scene.clone(true),
  referenceHandMaterial,
);
const object = styleModel(objectAsset.scene, objectMaterial);
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
document.querySelectorAll("[data-layer]").forEach((input) => {
  layers[input.dataset.layer].visible = input.checked;
  input.addEventListener("change", () => {
    layers[input.dataset.layer].visible = input.checked;
  });
});

const backdrop =
  new URLSearchParams(location.search).get("backdrop") || document.body.dataset.backdrop || "home";
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

function setTime(seconds) {
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
  timeline.value = Math.round((1000 * time) / data.duration);
  timeText.textContent = `${time.toFixed(1)}s`;
  rewardValue.textContent = rewards[index].toFixed(2);
  const cursorX = ((index + alpha) * 600) / (data.frame_count - 1);
  rewardCursor.setAttribute("x1", cursorX);
  rewardCursor.setAttribute("x2", cursorX);
}

function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  if (width && height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
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
  if (event.code === "Space" && open && event.target.tagName !== "INPUT") {
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
  renderer.render(scene, camera);
}
