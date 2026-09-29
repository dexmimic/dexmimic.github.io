# DexMimic

Anonymous project page for DexMimic.

## Structure

- `index.html`: title, paper and appendix links, key insight, project video, abstract, teaser, method overview, interactive skills, and real-world video.
- `static/assets/`: combined paper PDF, standalone appendix, paper figures, and web videos.
- `static/css/style.css`: responsive page and frosted video controls.
- `static/js/player.js`: shared playback, seeking, and fullscreen controls; audio controls for the narrated overview only.
- `static/js/trajectories.js`: on-demand 3D iframe, close handling, and focus restoration.
- `static/assets/trajectories/`: 28 static Three.js examples, previews, display manifest, and shared runtime. Keep the vendor license and relative paths. Previews load lazily; 3D assets load only after selecting a card. Viewer pages and the project page must share an origin for the close message.

## Preview

```sh
npx http-server . -p 8766 -a 127.0.0.1 -c-1
```

Open http://127.0.0.1:8766. The preview server supports byte-range requests for video seeking. Review changes locally before publishing. GitHub Pages serves the `main` branch from the repository root.
