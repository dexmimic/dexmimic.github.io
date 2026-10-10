# Trajectory viewer

Serve the project page over HTTP and open a unit's `index.html?backdrop=studio`.
The project gallery opens the same viewer in an iframe with `embed=1`.

- `viewer.js` owns the renderer, camera, lighting, playback, and simulation layers.
- `human.js` loads the original human-hand surfaces and interpolates world-space vertices.
- `comparison.js` renders Human and Wuji with one camera and a draggable scissor boundary.
- `curtain.js` provides the shared pointer, touch, and keyboard slider.
- `framing.js` fits the complete motion while retaining the studio camera direction.

Each unit contains `trajectory.json`, its object GLB, and `human.json` with the
`oakink_human_surface_v1` contract. Human hands use the official MANO vertex
correspondence on the original OakInk SMPL-X surfaces: 778 vertices and 1538
triangles per hand. Vertex files are little-endian Float32 `[frame, vertex, xyz]`;
face files are little-endian Uint32 triangle indices. Coordinates are meters,
Z-up, with xyzw quaternions. Human and simulation frame times match.

`renderTime(seconds, side)` synchronously renders `human`, `simulation`, or
`compare` for media capture. Gallery comparisons use one packed 1280×640 video
with Human on the left and Wuji on the right. The page crops both halves from
the same decoded frame. The human object follows the original object poses
and shares the simulation object's current geometry, textures, and materials.

Comparison mode hides paths. Simulation mode restores the selected layers.
Drag the divider or use Left/Right, Home, and End while it has keyboard focus.
