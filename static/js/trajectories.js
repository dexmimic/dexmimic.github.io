const page = document.querySelector('main');
let trajectoryFrame;
let activeTrajectory;
let previousOverflow;

function openTrajectory(card) {
  activeTrajectory = card;
  const url = new URL(card.href);
  url.searchParams.set('embed', '1');
  trajectoryFrame = document.createElement('iframe');
  trajectoryFrame.className = 'trajectory-frame';
  trajectoryFrame.title = card.getAttribute('aria-label');
  trajectoryFrame.src = url.href;
  document.body.appendChild(trajectoryFrame);
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  page.inert = true;
  trajectoryFrame.focus();
}

function closeTrajectory() {
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

window.addEventListener('message', (event) => {
  if (event.origin === location.origin &&
      event.source === trajectoryFrame?.contentWindow &&
      event.data === 'trajectory-viewer-close') closeTrajectory();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && trajectoryFrame) closeTrajectory();
});
