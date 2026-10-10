import * as THREE from "three";
import { loadHuman } from "./human.js";
import { createCurtain } from "./curtain.js";

function humanScene(source) {
  const scene = new THREE.Scene();
  scene.background = source.background;
  scene.environment = source.environment;
  scene.environmentIntensity = source.environmentIntensity;
  scene.environmentRotation.copy(source.environmentRotation);
  source.children.filter((node) => node.isLight || node.name === "furniture")
    .forEach((node) => scene.add(node.clone()));
  return scene;
}

function modeToolbar(shell, viewport, setMode) {
  const toolbar = document.createElement("div");
  toolbar.className = "comparison-toolbar";
  toolbar.innerHTML = '<div class="comparison-modes" role="group" aria-label="Visualization mode">' +
    '<button type="button" data-mode="compare">MANO ↔ Wuji</button>' +
    '<button type="button" data-mode="simulation">Simulation</button></div>' +
    '<p>Drag the divider to compare.</p>';
  shell.querySelector(".viewer-main").prepend(toolbar);
  const buttons = [...toolbar.querySelectorAll("button")];
  const select = (mode) => {
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    const comparing = mode === "compare";
    shell.classList.toggle("comparing", comparing);
    viewport.classList.toggle("comparing", comparing);
    toolbar.querySelector("p").hidden = !comparing;
    setMode(comparing);
  };
  buttons.forEach((button) => button.addEventListener("click", () => select(button.dataset.mode)));
  select("compare");
}

export async function createComparison({ scene, renderer, camera, viewport, shell, object, objectLinks, updateObject, onModeChange, onDrag }) {
  const human = await loadHuman(new URL("human.json", document.baseURI));
  const leftScene = humanScene(scene);
  const humanObject = object.clone(true);
  const humanObjects = objectLinks.map((node) => node === object ? humanObject : humanObject.getObjectByName(node.name));
  leftScene.add(human.group, humanObject);
  const labels = document.createElement("div");
  labels.className = "comparison-labels";
  labels.innerHTML = '<span>MANO · Human</span><span>Wuji · Simulation</span>';
  viewport.appendChild(labels);
  const curtain = createCurtain(viewport, onDrag);
  let comparing = true;
  modeToolbar(shell, viewport, (value) => { comparing = value; onModeChange(value); });
  const size = new THREE.Vector2();
  return {
    bounds: human.bounds,
    setFrame(index, alpha) {
      human.setFrame(index, alpha);
      const first = human.data.frames[index].object;
      const next = human.data.frames[index + 1].object;
      humanObjects.forEach((node, j) => updateObject(node, first[j], next[j], alpha));
    },
    render(side = comparing ? "compare" : "simulation") {
      if (side !== "compare") {
        renderer.render(side === "human" ? leftScene : scene, camera);
        return;
      }
      renderer.getSize(size);
      const split = size.x * curtain.fraction;
      renderer.setScissorTest(true);
      renderer.setScissor(0, 0, split, size.y);
      renderer.render(leftScene, camera);
      // Extending past the canvas avoids a rounding seam at fractional cuts.
      renderer.setScissor(split, 0, size.x, size.y);
      renderer.render(scene, camera);
      renderer.setScissorTest(false);
    },
  };
}
