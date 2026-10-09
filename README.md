# DexMimic

Anonymous project page for DexMimic.

## Structure

- `index.html`: title, paper and appendix links, TL;DR, project video, expandable simulation examples, method overview with the key insight, experimental results, real-world video, and abstract with the teaser.
- `static/assets/`: combined paper PDF, standalone appendix, paper figures, and web videos.
- `static/assets/method.webp`: 1920×1080 lossless animation derived from the native PowerPoint export, with modules starting at 0, 2, 4, 6, and 8 seconds. It plays once for 10 seconds and holds the final frame.
- `static/css/style.css`: responsive page and frosted video controls.
- `static/js/player.js`: shared playback, seeking, and fullscreen controls; audio controls for the narrated overview only.
- `static/js/method.js`: downloads the animation once and restarts it when the figure enters the viewport, the page becomes visible, or browser history restores the page. Each playback uses a fresh object URL and releases the previous one. Reduced motion uses the static figure.
- `static/js/trajectories.js`: on-demand 3D iframe, preview-backed loading dialog, retry, close handling, and focus restoration. The shared launcher signals readiness after the first rendered frame; iframe load alone does not dismiss the loading dialog.
- `static/assets/trajectories/`: 28 static Three.js examples, previews, display manifest, and shared runtime. Keep the vendor license and relative paths. Previews load lazily; 3D assets load only after selecting a card. Viewer pages and the project page must share an origin for the close message.

## Preview

```sh
npx http-server . -p 8766 -a 127.0.0.1 -c-1
```

Open http://127.0.0.1:8766. The preview server supports byte-range requests for video seeking. Review changes locally before publishing. GitHub Pages serves the `main` branch from the repository root.

## Visualization appearance

The default viewer uses a white studio, soft environment lighting, and a fixed camera fitted to the complete rollout and reference motion. Simulation meshes retain their GLB materials; reference layers use translucent comparison colors.

- Original image textures take priority, including the doughnut's embedded JPEG. Recognizable scanned colors are retained; white-model and placeholder surfaces use everyday ceramic, plastic, glass, and metal palettes. The knife has separate plastic-handle and steel-blade materials.
- Object surfaces render on both sides. Selected rounded glassware, the green cup, bowl, and mouse receive smooth normals where missing. Blue cups retain native face shading. Original positions, triangle coverage, UVs, and image bytes are preserved.
- Wuji Hand 1 uses the existing link-local geometry with a matte dark palm, satin silver fingers, darker joint housings, and dark fingertip pads based on the [official product photograph](https://wuji.tech/en/hand). These are manually tuned PBR materials. Crease-aware normals preserve mechanical edges.
- Broad environment illumination and an offset key light reveal shape; a weaker near-neutral fill keeps contact surfaces readable. Glass uses built-in glTF transmission at half viewport resolution, with opaque shadow casting disabled.
- The [official description repository](https://github.com/wuji-technology/wuji-description/tree/c2cd7f8d1ef8b6dc8cb907c17daa5a88b4442d95/hand/body) supplies the matched model geometry. Its MIT license is included in `static/assets/trajectories/shared/hands/license.txt`.
- `static/assets/trajectories/shared/appearance-provenance.json` records the appearance sources. The trajectory data and link transforms are unchanged.

### Experimental results

`static/js/results.js` renders the complete benchmark table and SVG charts from `static/assets/results.json`. The adaptation points are kept in `static/assets/adaptation.csv`, using the author-confirmed paper curve without further transformations. Results animate on viewport entry and replay after leaving and returning; reduced-motion settings display final values immediately. Hover or keyboard-focus a scaling bar for its exact success rate.

### Responsive layout

`static/css/layout.css` aligns section headings on a shared 1040 px container and controls inner element widths: 780 px for reading, 1000 px for videos and method figures, 920 px for metric cards, 960 px for result tables and paired charts, and 1040 px for simulation galleries. Below 760 px, cards and charts stack; the benchmark table scrolls horizontally with the method column fixed.

White sections alternate with full-width warm-gray (`#FAFAF9`) bands. The opening TL;DR is an aside with an internal label and two-sentence summary, using a solid background rather than glass blur.

Simulation follows the project video. The gallery initially shows two rows at the current responsive column count; Expand reveals all 28 examples, and Collapse restores the preview.
