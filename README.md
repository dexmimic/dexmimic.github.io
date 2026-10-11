# DexMimic

Anonymous project page for DexMimic.

## Structure

- `index.html`: a full-screen anonymous teaser, paper and appendix links, a blue/terracotta "single policy, many trajectories." heading above TL;DR, a spoon-based pipeline, expandable simulation examples, method overview, results, seven matched human/simulation/robot examples, and a final Introduction combining the abstract and narrated project video.
- `static/js/teaser.js` and `static/css/teaser.css`: all 28 existing comparisons arranged as a responsive matrix behind a translucent title, with the blue/terracotta DexMimic name, one global divider, and links to the page sections. The arrow sits just above the title. The background remains visible without a dark overlay or text shadow. A single video atlas supplies both MANO and Wuji; no 3D models load in the hero. Motion plays automatically, pauses outside the viewport or when the document is hidden, and resumes on return. Reduced motion uses the draggable poster.
- `static/assets/teaser/`: a 2688×3072, 24 fps, 18-second H.264 atlas with 384 px tiles, a high-quality JPEG poster, and `atlas.json`. The seven-column, four-row MANO matrix is above the matching Wuji matrix. Each original clip loops at its own duration within the shared 18-second atlas. The hero reuses the gallery cameras, semantic materials, and crops; its background is gray through compositing.
- `static/assets/`: combined paper PDF, standalone appendix, paper figures, and web videos.
- `static/assets/method.webp`: 1900×1000 lossless animation cropped from the native PowerPoint export and played at 1.5× speed, with modules starting at 0, 1.333, 2.667, 4, and 5.333 seconds. Its 176 unchanged frames play once for 6.667 seconds and hold the final frame; `method.png` uses the same cropped aspect ratio for reduced motion.
- `static/css/style.css`: responsive page and frosted video controls. Page text and the 3D viewer use the system monospace stack (`ui-monospace`, `SFMono-Regular`, `SF Mono`, `Menlo`, `Consolas`, `monospace`); form controls inherit it. Text baked into media keeps the source typography.
- `static/js/player.js`: shared playback, seeking, and fullscreen controls; audio controls for the narrated overview only.
- `static/js/method.js`: downloads the animation once and restarts it when the figure enters the viewport, the page becomes visible, or browser history restores the page. Each playback uses a fresh object URL and releases the previous one. Reduced motion uses the static figure.
- `static/js/trajectories.js`: on-demand 3D iframe, preview-backed loading dialog, retry, close handling, and focus restoration. The shared launcher signals readiness after the first rendered frame; iframe load alone does not dismiss the loading dialog.
- `static/js/curtain-previews.js`: draggable MANO/Wuji comparisons for all 28 simulation cards. Each frame contains both renders in one packed video, so the divider moves without changing their playback phase. Both halves use the same camera, lighting, object materials, and crop. Reduced motion uses a draggable packed poster.
- `static/assets/trajectories/`: 28 Three.js examples, silent looping video previews, poster images, display manifest, and shared runtime. Keep the vendor license and relative paths. A preview video loads only after entering the viewport and pauses when offscreen, collapsed, hidden, or a 3D viewer is open. Reduced motion keeps static posters. 3D assets load only after selecting a card; viewer pages and the project page must share an origin for the close message.
- `static/assets/trajectories/shared/`: the 3D viewer, human-surface loader, shared divider, and comparison renderer. See [the runtime and data contract](static/assets/trajectories/shared/readme.md). Human motion comes from the original OakInk SMPL-X surfaces extracted through the official MANO vertex correspondence, with raw object poses sampled at the gallery's reference frame indices. Object meshes reuse the current semantic GLB materials.
- `static/assets/pipeline/`: seven sets of square human-hand, simulation, and individually cropped real-robot clips. Human hands use the complete 778-vertex, 1538-face MANO topology and its official correspondence to the original OakInk SMPL-X surfaces, preserving the natural wrist opening. Human/simulation renders share each instance's fixed camera, object asset, and studio lighting; their original motion samples are preserved. Beaker shaking keeps its adjusted camera, and test-tube shaking uses a higher camera looking down to better match the real recording. Real clips keep the selected action interval and use a constant playback-speed change to match that instance's simulation duration. The three clips start together after loading, loop with phase correction, and pause offscreen, when collapsed, or while viewing 3D. Reduced motion keeps static posters.

The triplets illustrate corresponding motions from existing per-trajectory and co-training checkpoints. They do not form a new evaluation of one shared checkpoint. The real-robot recordings show motion replay; the simulation videos show the recorded tracking rollouts.

## Preview

```sh
npx http-server . -p 8766 -a 127.0.0.1 -c-1
```

Open http://127.0.0.1:8766. The preview server supports byte-range requests for video seeking. Review changes locally before publishing. GitHub Pages serves the `main` branch from the repository root.

## Visualization appearance

The default viewer uses a white studio, soft environment lighting, and one camera fitted to the complete simulation and human motion. The MANO/Wuji mode shows original human motion on the left and the recorded simulation on the right, with a shared timeline and draggable divider. Simulation meshes retain their GLB materials; human hands use matte light blue.

Gallery videos and the default 3D comparison omit hand and object trajectory lines. Switching the interactive viewer to Simulation reveals its existing layers, with both simulation trajectory paths checked by default and reference paths off. The divider supports dragging, arrow keys, Home, and End.

Per-example crop percentages enlarge both sides of the packed videos and posters equally without changing the camera angle. Each Simulation card gives one uniform left–right–left sweep lasting 3.5 seconds when its whole square preview is visible, as its bottom enters the viewport. This applies independently to all rows, including cards revealed by Expand. The sweep ends continuously at the left to display only Wuji; scrolling away and returning does not replay it. A pending poster waits until the card is ready and fully visible. Dragging or using the slider keys cancels that divider's cue and preserves the user's position. The hero retains its independent 2.5-second introduction: left–right–left–title boundary, with a continuous final movement to the split between Dex and Mimic. The resting position follows the rendered title on resize, while a manually positioned divider stays where the user placed it.

Simulation card handles stay fully inside both preview edges. At rest, the circle's left edge touches the preview boundary and the divider is inset by the circle's radius; the image still shows the complete Wuji render. Interior divider positions follow the comparison cut directly. The hero and 3D handles keep their existing edge limits.

View 3D prompts use frosted glass and a gentle 3.8-second breathing highlight while visible. In the interactive viewer, the blue MANO/Wuji and terracotta Simulation tabs use the same slow highlight. The 3D divider opens at the center without a sweep. Reduced motion suppresses the sweep and highlights while retaining manual comparisons.

- Original image textures take priority, including the doughnut's embedded JPEG. Recognizable scanned colors are retained; white-model and placeholder surfaces use everyday ceramic, plastic, glass, and metal palettes. The knife has separate plastic-handle and steel-blade materials.
- Object surfaces render on both sides. Selected rounded glassware, the green cup, bowl, and mouse receive smooth normals where missing. Blue cups retain native face shading. Original positions, triangle coverage, UVs, and image bytes are preserved.
- Wuji Hand 1 uses the existing link-local geometry with a matte dark palm, satin silver fingers, and darker joint housings based on the [official product photograph](https://wuji.tech/en/hand), with soft off-white fingertip pads following the author-provided reference image. These are manually tuned PBR materials. Crease-aware normals preserve mechanical edges.
- Broad environment illumination and an offset key light reveal shape; a weaker near-neutral fill keeps contact surfaces readable. Glass uses built-in glTF transmission at half viewport resolution, with opaque shadow casting disabled.
- The [official description repository](https://github.com/wuji-technology/wuji-description/tree/c2cd7f8d1ef8b6dc8cb907c17daa5a88b4442d95/hand/body) supplies the matched model geometry. Its MIT license is included in `static/assets/trajectories/shared/hands/license.txt`.
- `static/assets/trajectories/shared/appearance-provenance.json` records the appearance sources. The trajectory data and link transforms are unchanged.

### Experimental results

`static/js/results.js` renders the complete benchmark table and SVG charts from `static/assets/results.json`. The adaptation points are kept in `static/assets/adaptation.csv`, using the author-confirmed paper curve without further transformations. Results animate on viewport entry and replay after leaving and returning; reduced-motion settings display final values immediately. Hover or keyboard-focus a scaling bar for its exact success rate. In Fast Adaptation, hovering sets a horizontal success-rate guide and shows the first time each curve reaches it, interpolated between recorded points; unreached rates display "Not reached." Keyboard focus starts at 80%, arrow keys adjust the rate, and Escape hides the guide.

### Responsive layout

`static/css/layout.css` aligns plain-text section headings on a shared 1040 px container and controls inner element widths: 780 px for reading, 1000 px for videos and method figures, 920 px for metric cards, 960 px for result tables and paired charts, and 1040 px for simulation galleries. The method key insight follows the cropped figure and shares its width. Below 760 px, cards and charts stack; the benchmark table scrolls horizontally with the method column fixed.

Six full-width blocks alternate white and warm gray (`#FAFAF9`): TL;DR and Pipeline together, Simulation, Method, Results, Realworld, and Introduction. Pipeline labels sit above the square panels as Motion Capture → DexMimic Policy → Deployment, with the existing blue/terracotta name colors. The opening TL;DR is an aside with an internal label and two-sentence summary, using a solid background rather than glass blur. The scaling legend fits one line on desktop; below 1000 px it can wrap naturally.

Pipeline follows TL;DR, and Simulation follows Pipeline. The final Introduction places the abstract text above the narrated project video. The gallery initially shows three rows at the current responsive column count; Expand reveals all 28 examples, and Collapse restores the preview. Realworld initially shows mouse, spoon, and roll manipulation; its matching Expand button reveals the other four triplets. Its centered section is capped at 800 px, with three equal square panels, 20 px column gaps, 16 px operation headings, and about 309 px per row including the 26 px separation. At the existing 760 px breakpoint, the content fits the viewport with 12 px column gaps, smaller labels, and 20 px row separation. Arrows connect the three columns in both sections.

The six HLG real-robot recordings are converted from their original 10-bit sources to SDR BT.709 with VideoToolbox color conversion before cropping and encoding. Their selected motion, playback speed, 640 px square resolution, 30 fps, and CRF 18 are preserved. Posters come from the converted clips. The mouse recording was already SDR and remains unchanged.

Gallery captions use compact line spacing. Grid gaps are 10 px for four or three columns and 8 px for two or one; card widths and the gallery container width remain unchanged, with the remaining space centered.
