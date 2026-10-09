const animation = document.querySelector('#method-animation');

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let inView = false;
  let source;
  let currentUrl;
  let revision = 0;

  async function updatePlayback() {
    const request = ++revision;
    if (!inView || document.visibilityState !== 'visible') return;

    source ??= fetch(animation.dataset.src).then(response => response.blob());
    const blob = await source;
    if (request !== revision) return;

    const previousUrl = currentUrl;
    currentUrl = URL.createObjectURL(blob);
    animation.src = currentUrl;
    if (previousUrl) URL.revokeObjectURL(previousUrl);
  }

  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updatePlayback();
  });
  observer.observe(animation);
  document.addEventListener('visibilitychange', updatePlayback);
  window.addEventListener('pageshow', event => {
    if (event.persisted) updatePlayback();
  });
  window.addEventListener('pagehide', () => { revision += 1; });
}
