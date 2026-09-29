function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function bindProgress(player, video) {
  const progress = player.querySelector('.video-progress');
  const time = player.querySelector('.video-time');
  function updateProgress() {
    progress.value = video.currentTime / video.duration * 1000;
    progress.style.setProperty('--played', `${progress.value / 10}%`);
    time.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    progress.setAttribute('aria-valuetext', time.textContent);
  }
  function loadMetadata() {
    progress.disabled = false;
    updateProgress();
  }
  video.addEventListener('loadedmetadata', loadMetadata);
  video.addEventListener('timeupdate', updateProgress);
  video.addEventListener('seeked', updateProgress);
  progress.addEventListener('input', () => {
    video.currentTime = Number(progress.value) / 1000 * video.duration;
    updateProgress();
  });
  if (video.readyState >= 1) loadMetadata();
}

function bindPlayback(player, video) {
  const play = player.querySelector('.play-toggle');
  const start = player.querySelector('.video-start');
  async function togglePlayback() {
    if (video.paused) await video.play();
    else video.pause();
  }
  function updatePlayback() {
    player.dataset.playing = String(!video.paused);
    play.setAttribute('aria-label', video.paused ? 'Play' : 'Pause');
    start.hidden = !video.paused;
  }
  for (const event of ['play', 'pause', 'ended']) {
    video.addEventListener(event, updatePlayback);
  }
  for (const control of [video, play, start]) {
    control.addEventListener('click', togglePlayback);
  }
  updatePlayback();
}

function bindFullscreen(player) {
  const fullscreen = player.querySelector('.fullscreen-toggle');
  fullscreen.addEventListener('click', async () => {
    if (document.fullscreenElement === player) await document.exitFullscreen();
    else await player.requestFullscreen();
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreen.setAttribute('aria-label', document.fullscreenElement === player ? 'Exit fullscreen' : 'Enter fullscreen');
  });
}

function initializePlayer(player) {
  const video = player.querySelector('video');
  bindProgress(player, video);
  bindPlayback(player, video);
  bindFullscreen(player);
  for (const mute of player.querySelectorAll('.mute-toggle')) {
    mute.addEventListener('click', () => {
      video.muted = !video.muted;
    });
    video.addEventListener('volumechange', () => {
      mute.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
      mute.setAttribute('aria-pressed', String(video.muted));
    });
  }
}

document.querySelectorAll('.video-player').forEach(initializePlayer);
