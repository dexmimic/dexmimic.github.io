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
  url.searchParams.set('v', '20260930-loading');
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
