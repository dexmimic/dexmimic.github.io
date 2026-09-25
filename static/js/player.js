const player = document.querySelector('.video-player');
const video = player.querySelector('video');
const play = player.querySelector('.play-toggle');
const start = player.querySelector('.video-start');
const progress = player.querySelector('.video-progress');
const time = player.querySelector('.video-time');
const mute = player.querySelector('.mute-toggle');
const fullscreen = player.querySelector('.fullscreen-toggle');

function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function updateProgress() {
  progress.value = video.currentTime / video.duration * 1000;
  progress.style.setProperty('--played', `${progress.value / 10}%`);
  time.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  progress.setAttribute('aria-valuetext', time.textContent);
}

async function togglePlayback() {
  if (video.paused) await video.play();
  else video.pause();
}

function updatePlayback() {
  player.dataset.playing = String(!video.paused);
  play.setAttribute('aria-label', video.paused ? 'Play' : 'Pause');
  start.hidden = !video.paused;
}

video.addEventListener('loadedmetadata', () => {
  progress.disabled = false;
  updateProgress();
});
video.addEventListener('timeupdate', updateProgress);
video.addEventListener('seeked', updateProgress);
video.addEventListener('play', updatePlayback);
video.addEventListener('pause', updatePlayback);
video.addEventListener('ended', updatePlayback);
video.addEventListener('click', togglePlayback);
play.addEventListener('click', togglePlayback);
start.addEventListener('click', togglePlayback);
progress.addEventListener('input', () => {
  video.currentTime = Number(progress.value) / 1000 * video.duration;
  updateProgress();
});
mute.addEventListener('click', () => {
  video.muted = !video.muted;
});
video.addEventListener('volumechange', () => {
  mute.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
  mute.setAttribute('aria-pressed', String(video.muted));
});
fullscreen.addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await player.requestFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  fullscreen.setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen');
});
