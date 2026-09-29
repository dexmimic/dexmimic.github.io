# DexMimic

Anonymous project page for DexMimic.

## Structure

- `index.html`: title, paper and appendix links, key insight, project video, abstract, teaser, method overview, and real-world video.
- `static/assets/`: combined paper PDF, standalone appendix, paper figures, and web videos.
- `static/css/style.css`: responsive page and frosted video controls.
- `static/js/player.js`: shared playback, seeking, and fullscreen controls; audio controls for the narrated overview only.

## Preview

```sh
npx http-server . -p 8766 -a 127.0.0.1 -c-1
```

Open http://127.0.0.1:8766. The preview server supports byte-range requests for video seeking. Review changes locally before publishing. GitHub Pages serves the `main` branch from the repository root.
