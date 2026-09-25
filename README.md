# DexMimic

Anonymous project page for DexMimic.

## Structure

- `index.html`: title, appendix link, project video, abstract, teaser, and method overview.
- `static/assets/`: supplemental PDF and paper figures.
- `static/css/style.css`: responsive page and frosted video controls.
- `static/js/player.js`: playback, seeking, mute, and fullscreen controls.

## Preview

```sh
npx http-server . -p 8766 -a 127.0.0.1 -c-1
```

Open http://127.0.0.1:8766. The preview server supports byte-range requests for video seeking. Review changes locally before publishing. GitHub Pages serves the `main` branch from the repository root.
