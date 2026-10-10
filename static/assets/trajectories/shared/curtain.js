function createCue(setFraction, restingFraction) {
  let frame = 0;
  let dismissed = false;
  const cancel = (restore = false) => {
    if (restore && frame) setFraction(restingFraction);
    cancelAnimationFrame(frame);
    frame = 0;
  };
  const play = (startedAt = performance.now()) => {
    if (dismissed || performance.now() - startedAt >= 2500) return;
    cancel();
    const step = (now) => {
      const distance = Math.min((now - startedAt) / 2500, 1) * (2 + restingFraction);
      setFraction(distance <= 1 ? distance : distance <= 2 ? 2 - distance : distance - 2);
      if (distance < 2 + restingFraction) frame = requestAnimationFrame(step);
      else frame = 0;
    };
    step(performance.now());
  };
  const dismiss = () => { dismissed = true; cancel(); };
  return { play, cancel, dismiss };
}

export function createCurtain(container, onChange = () => {}, onInput = () => {}, restingFraction = 0.5) {
  const divider = document.createElement("div");
  divider.className = "curtain-divider";
  divider.setAttribute("role", "slider");
  divider.setAttribute("aria-label", "Reveal human or Wuji motion");
  divider.setAttribute("aria-orientation", "horizontal");
  divider.setAttribute("aria-valuemin", "0");
  divider.setAttribute("aria-valuemax", "100");
  divider.tabIndex = 0;
  divider.innerHTML = '<span class="curtain-grip" aria-hidden="true">↔</span>';
  container.appendChild(divider);
  let fraction = restingFraction;
  let pointerId = null;

  function setFraction(value) {
    fraction = Math.min(1, Math.max(0, value));
    container.style.setProperty("--cut", `${fraction * 100}%`);
    const percent = Math.round(fraction * 100);
    divider.setAttribute("aria-valuenow", String(percent));
    divider.setAttribute("aria-valuetext", `${percent}% Human, ${100 - percent}% Wuji`);
    onInput(fraction);
  }

  function move(event) {
    const bounds = container.getBoundingClientRect();
    setFraction((event.clientX - bounds.left) / bounds.width);
  }

  const cue = createCue(setFraction, restingFraction);
  divider.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    cue.dismiss();
    divider.focus({ preventScroll: true });
    pointerId = event.pointerId;
    divider.setPointerCapture(event.pointerId);
    onChange(true);
    move(event);
  });
  divider.addEventListener("pointermove", (event) => { if (event.pointerId === pointerId) move(event); });
  const endDrag = (event) => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    onChange(false);
  };
  divider.addEventListener("lostpointercapture", endDrag);
  divider.addEventListener("pointercancel", endDrag);
  divider.addEventListener("keydown", (event) => {
    const values = { ArrowLeft: fraction - 0.05, ArrowRight: fraction + 0.05, Home: 0, End: 1 };
    if (!(event.key in values)) return;
    event.preventDefault();
    cue.dismiss();
    setFraction(values[event.key]);
  });
  setFraction(restingFraction);
  return { divider, get fraction() { return fraction; }, setFraction, playCue: cue.play, cancelCue: cue.cancel };
}
