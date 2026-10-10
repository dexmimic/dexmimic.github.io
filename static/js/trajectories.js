const page = document.querySelector('main');
const loadingPreview = document.getElementById('trajectory-loading');
const loadingText = loadingPreview.querySelector('.trajectory-loading-text');
const retryButton = loadingPreview.querySelector('.trajectory-retry');
let trajectoryFrame;
let activeTrajectory;
let previousOverflow;
let loadingTimer;

function startTrajectory() {
  clearTimeout(loadingTimer);
  trajectoryFrame?.remove();
  loadingPreview.dataset.state = 'loading';
  loadingText.textContent = 'Loading...';
  retryButton.hidden = true;
  const url = new URL(activeTrajectory.href);
  url.searchParams.set('embed', '1');
  url.searchParams.set('v', '20261010-white-tips');
  trajectoryFrame = document.createElement('iframe');
  trajectoryFrame.className = 'trajectory-frame';
  trajectoryFrame.title = activeTrajectory.getAttribute('aria-label');
  trajectoryFrame.inert = true;
  trajectoryFrame.src = url.href;
  document.body.appendChild(trajectoryFrame);
  loadingPreview.querySelector('.trajectory-loading-close').focus();
  loadingTimer = setTimeout(() => {
    loadingText.textContent = 'Still loading...';
    retryButton.hidden = false;
  }, 20000);
}

function openTrajectory(card) {
  activeTrajectory = card;
  document.getElementById('trajectory-loading-title').textContent = card.querySelector('.trajectory-name').textContent;
  loadingPreview.querySelector('img').src = card.querySelector('img').src;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  page.inert = true;
  loadingPreview.showModal();
  startTrajectory();
  updatePreviewPlayback();
}

function revealTrajectory() {
  clearTimeout(loadingTimer);
  loadingPreview.close();
  trajectoryFrame.inert = false;
  trajectoryFrame.focus();
}

function showTrajectoryError() {
  clearTimeout(loadingTimer);
  loadingPreview.dataset.state = 'error';
  loadingText.textContent = 'Unable to load 3D.';
  retryButton.hidden = false;
}

function closeTrajectory() {
  clearTimeout(loadingTimer);
  loadingPreview.close();
  trajectoryFrame.remove();
  trajectoryFrame = null;
  updatePreviewPlayback();
  page.inert = false;
  document.body.style.overflow = previousOverflow;
  activeTrajectory.focus({ preventScroll: true });
}

document.querySelectorAll('.trajectory-card').forEach((card) => {
  card.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openTrajectory(card);
  });
});

loadingPreview.querySelector('.trajectory-loading-close').addEventListener('click', closeTrajectory);
retryButton.addEventListener('click', startTrajectory);

window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.source !== trajectoryFrame?.contentWindow) return;
  if (event.data === 'trajectory-viewer-close') closeTrajectory();
  if (event.data === 'trajectory-viewer-ready') revealTrajectory();
  if (event.data === 'trajectory-viewer-error' && loadingPreview.open) showTrajectoryError();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && trajectoryFrame) {
    event.preventDefault();
    closeTrajectory();
  }
});

const simulationExpand = document.getElementById('expand-simulation');
const simulationGrid = document.getElementById('simulation-grid');
simulationExpand.addEventListener('click', () => {
  const expanded = simulationExpand.getAttribute('aria-expanded') !== 'true';
  simulationExpand.setAttribute('aria-expanded', String(expanded));
  simulationGrid.dataset.expanded = String(expanded);
  simulationExpand.textContent = expanded ? 'Collapse' : 'Expand';
  updatePreviewPlayback();
  if (!expanded) document.getElementById('method-title').scrollIntoView({ behavior: 'instant', block: 'start' });
});

const realworldExpand = document.getElementById('expand-realworld');
const realworldList = document.getElementById('realworld-list');
realworldExpand.addEventListener('click', () => {
  const expanded = realworldExpand.getAttribute('aria-expanded') !== 'true';
  realworldExpand.setAttribute('aria-expanded', String(expanded));
  realworldList.dataset.expanded = String(expanded);
  realworldExpand.textContent = expanded ? 'Collapse' : 'Expand';
  updatePreviewPlayback();
  if (!expanded) document.getElementById('realworld-title').scrollIntoView({ behavior: 'instant', block: 'start' });
});

const previewVideos = [...document.querySelectorAll('.trajectory-preview video')];
const previewActions = [...document.querySelectorAll('.trajectory-action')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const visiblePreviews = new Set();
const visibleActions = new Set();
const visibleTriplets = new Set();
const triplets = [...document.querySelectorAll('.motion-triplet')].map((row) => ({
  row, videos: [...row.querySelectorAll('video')], active: false, loaded: false, ready: false,
}));

function playVideo(video) {
  video.play().catch((error) => {
    if (error.name !== 'AbortError') throw error;
  });
}

function playTriplet(group) {
  group.videos.forEach((video) => { video.currentTime = 0; });
  group.videos.forEach((video) => {
    video.autoplay = true;
    playVideo(video);
  });
}

triplets.forEach((group) => {
  let ready = 0;
  group.videos.forEach((video) => {
    video.autoplay = false;
    video.addEventListener('canplay', () => {
      ready += 1;
      if (ready === group.videos.length) {
        group.ready = true;
        if (group.active) playTriplet(group);
      }
    }, { once: true });
  });
  group.videos[0].addEventListener('timeupdate', () => {
    if (!group.active) return;
    const time = group.videos[0].currentTime;
    group.videos.slice(1).forEach((video) => {
      if (Math.abs(video.currentTime - time) > 0.07) video.currentTime = time;
    });
  });
});

function cancelPreviewHint(action) {
  action.classList.remove('is-hinting');
}

function hintPreview(action) {
  if (document.hidden || reducedMotion.matches || trajectoryFrame) return;
  action.classList.add('is-hinting');
}

function hintVisibleActions() {
  for (const action of visibleActions) {
    if (action.getClientRects().length) hintPreview(action);
  }
}

function updatePreviewPlayback() {
  const canPlay = !document.hidden && !trajectoryFrame;
  for (const video of previewVideos) {
    const active = canPlay && !reducedMotion.matches && visiblePreviews.has(video) && video.getClientRects().length;
    video.autoplay = active;
    if (active) {
      if (!video.hasAttribute('src')) video.src = video.dataset.src;
      playVideo(video);
    } else {
      video.pause();
    }
  }
  for (const group of triplets) {
    const active = Boolean(canPlay && !reducedMotion.matches && visibleTriplets.has(group.row) && group.row.getClientRects().length);
    if (active === group.active) continue;
    group.active = active;
    if (!active) {
      group.videos.forEach((video) => { video.autoplay = false; video.pause(); });
    } else if (group.ready) {
      playTriplet(group);
    } else if (!group.loaded) {
      group.loaded = true;
      group.videos.forEach((video) => {
        video.preload = 'auto';
        video.src = video.dataset.src;
      });
    }
  }
  if (!canPlay || reducedMotion.matches) previewActions.forEach(cancelPreviewHint);
  else hintVisibleActions();
}

const previewObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const video = entry.target.querySelector('video');
    if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
      visiblePreviews.add(video);
    } else {
      visiblePreviews.delete(video);
    }
  }
  updatePreviewPlayback();
}, { threshold: 0.1 });
previewVideos.forEach((video) => previewObserver.observe(video.parentElement));
const tripletObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting && entry.intersectionRatio >= 0.1) visibleTriplets.add(entry.target);
    else visibleTriplets.delete(entry.target);
  }
  updatePreviewPlayback();
}, { threshold: 0.1 });
triplets.forEach((group) => tripletObserver.observe(group.row));
const actionObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const action = entry.target;
    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
      if (!visibleActions.has(action)) hintPreview(action);
      visibleActions.add(action);
    } else {
      visibleActions.delete(action);
      cancelPreviewHint(action);
    }
  }
}, { threshold: 0.5 });
previewActions.forEach((action) => actionObserver.observe(action));
document.addEventListener('visibilitychange', updatePreviewPlayback);
reducedMotion.addEventListener('change', updatePreviewPlayback);
