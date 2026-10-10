import * as THREE from "three";

function createHand(metadata, vertices, faces) {
  const positions = new Float32Array(metadata.vertex_count * 3);
  positions.set(vertices.subarray(0, positions.length));
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(new THREE.BufferAttribute(faces, 1));
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.computeVertexNormals();
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(...metadata.bounds.min), new THREE.Vector3(...metadata.bounds.max),
  );
  geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(new THREE.Sphere());
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color: "#a5d9ef", roughness: 0.67, metalness: 0, side: THREE.DoubleSide,
  }));
  mesh.name = `human_${metadata.side}`;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, vertices, positions };
}

function updateHand(hand, index, alpha) {
  const { vertices, positions, mesh } = hand;
  const first = index * positions.length;
  const next = first + positions.length;
  for (let i = 0; i < positions.length; i++) {
    positions[i] = vertices[first + i] * (1 - alpha) + vertices[next + i] * alpha;
  }
  mesh.geometry.attributes.position.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}

export async function loadHuman(url) {
  const data = await fetch(url).then((response) => response.json());
  const binary = (path) => fetch(new URL(path, url)).then((response) => response.arrayBuffer());
  const hands = await Promise.all(data.hands.map(async (metadata) => {
    const [vertices, faces] = await Promise.all([binary(metadata.vertices), binary(metadata.faces)]);
    return createHand(metadata, new Float32Array(vertices), new Uint32Array(faces));
  }));
  const group = new THREE.Group();
  group.add(...hands.map((hand) => hand.mesh));
  return {
    data, group,
    bounds: new THREE.Box3(new THREE.Vector3(...data.bounds.min), new THREE.Vector3(...data.bounds.max)),
    setFrame: (index, alpha) => hands.forEach((hand) => updateHand(hand, index, alpha)),
  };
}
