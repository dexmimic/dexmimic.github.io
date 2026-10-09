import * as THREE from "three";

export function motionBounds(data, handLinks, objectLinks) {
  const handBoxes = handLinks.map((node) => new THREE.Box3().setFromObject(node));
  const objectBoxes = objectLinks.map((node) => new THREE.Box3().setFromObject(node));
  const bounds = new THREE.Box3();
  const box = new THREE.Box3();
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);

  for (const frame of data.frames) {
    for (const key of ["hand", "reference_hand"]) {
      frame[key].forEach((pose, index) => {
        position.fromArray(pose);
        rotation.fromArray(pose, 3);
        matrix.compose(position, rotation, scale);
        bounds.union(box.copy(handBoxes[index]).applyMatrix4(matrix));
      });
    }
    for (const key of ["object", "reference_object"]) {
      const objects = data.object_links ? frame[key] : [frame[key]];
      objects.forEach((pose, index) => {
        position.fromArray(pose[0]);
        rotation.fromArray(pose[1]);
        matrix.compose(position, rotation, scale);
        bounds.union(box.copy(objectBoxes[index]).applyMatrix4(matrix));
      });
    }
  }
  return bounds;
}

export function frameMotion(camera, controls, bounds) {
  const center = bounds.getCenter(new THREE.Vector3());
  const direction = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(center).add(direction);
  camera.lookAt(center);
  const inverseRotation = camera.quaternion.clone().invert();
  const vertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const horizontal = vertical * camera.aspect;
  let distance = 0;
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const corner = new THREE.Vector3(x, y, z).sub(center).applyQuaternion(inverseRotation);
        distance = Math.max(distance,
          corner.z + 1.15 * Math.abs(corner.x) / horizontal,
          corner.z + 1.15 * Math.abs(corner.y) / vertical);
      }
    }
  }
  camera.position.copy(center).addScaledVector(direction, distance);
  controls.target.copy(center);
  controls.minDistance = distance * 0.3;
  controls.maxDistance = distance * 4;
  controls.update();
}
