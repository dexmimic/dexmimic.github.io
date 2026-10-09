const results = await fetch('static/assets/results.json').then(response => response.json());
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const colors = ['#5B8FF9', '#2FA7A0', '#9B82C4'];
const levels = ['L1', 'L2', 'L3'];

function number(value, digits = 2) {
  return `<span data-count="${value}" data-digits="${digits}">${value.toFixed(digits)}</span>`;
}

function renderCards() {
  const [baseline, , ours] = results.benchmark.map(row => row.values);
  document.querySelector('#metric-cards').innerHTML = `
    <article class="metric-card"><h3>Success Rate ↑</h3>
      <div class="metric-value">${number(ours[0])}<small>%</small></div>
      <p><strong>+${number(ours[0] - baseline[0])} percentage points</strong><br>over the baseline method on 50 challenging bimanual trajectories.</p></article>
    <article class="metric-card"><h3>Average Training Time ↓</h3>
      <div class="metric-value">${number(ours[1])}<small> h / trajectory</small></div>
      <p><strong>${number(baseline[1] / ours[1], 1)}× lower time cost</strong><br>than the baseline method, averaged over joint training.</p></article>
    <article class="metric-card"><h3>Object Tracking Error ↓</h3>
      <div class="metric-value error-values"><span>${number(ours[3])}<small> mm</small></span><span>${number(ours[2])}<small> rad</small></span></div>
      <p>Object translation and rotation errors.<br>Lower is better for both metrics.</p></article>`;
}

function renderTable() {
  const best = results.metrics.map((metric, column) => {
    const values = results.benchmark.map(row => row.values[column]);
    return metric.direction === 'up' ? Math.max(...values) : Math.min(...values);
  });
  const headers = results.metrics.map(metric => `<th scope="col">${metric.label} ${metric.direction === 'up' ? '↑' : '↓'}<br><span class="metric-unit">${metric.symbol} · ${metric.unit}</span></th>`).join('');
  const rows = results.benchmark.map(row => `<tr class="${row.name === 'DexMimic' ? 'ours' : ''}"><th scope="row">${row.name}</th>${row.values.map((value, column) => `<td class="${value === best[column] ? 'best' : ''}">${number(value, results.metrics[column].digits)}</td>`).join('')}</tr>`).join('');
  document.querySelector('#benchmark-table').innerHTML = `<table class="results-table" aria-label="Tracking performance and average training or optimization time on 50 challenging bimanual trajectories"><thead><tr><th scope="col">Method</th>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

function axes(xLabel, yLabel, maxY = 100) {
  const ticks = [0, 20, 40, 60, 80, 100].map(value => {
    const y = 285 - value / maxY * 235;
    return `<line class="gridline" x1="60" x2="500" y1="${y}" y2="${y}"/><text x="49" y="${y + 5}" text-anchor="end">${value}</text>`;
  }).join('');
  return `${ticks}<path class="axis" d="M60 45V285H500" fill="none"/><text class="axis-label" x="280" y="332" text-anchor="middle">${xLabel}</text><text class="axis-label" x="10" y="26">${yLabel}</text>`;
}

function scalingGroup(row, index) {
  const center = 115 + index * 110;
  const bars = row.values.map((value, level) => {
    const height = value / 100 * 235;
    const label = `${row.scale} trajectories · ${levels[level]}: ${value.toFixed(2)}%`;
    return `<rect class="bar-grow" tabindex="0" aria-label="${label}" data-label="${label}" x="${center - 40 + level * 28}" y="${285 - height}" width="23" height="${height}" rx="3" fill="${colors[level]}"><title>${label}</title></rect>`;
  }).join('');
  return `<g>${bars}<text x="${center}" y="311" text-anchor="middle">${row.scale}</text></g>`;
}

function renderScaling() {
  const chart = document.querySelector('#scaling-chart');
  chart.innerHTML = `<svg class="experiment-chart" viewBox="0 0 520 348" role="group" aria-labelledby="scaling-chart-title"><title id="scaling-chart-title">Zero-shot success rates by training scale</title>${axes('Training trajectories', 'Zero-shot SR (%)')}${results.scaling.map(scalingGroup).join('')}</svg><div class="chart-tooltip" role="status" hidden></div>`;
  const tooltip = chart.querySelector('.chart-tooltip');
  chart.querySelectorAll('.bar-grow').forEach(bar => {
    const show = () => {
      tooltip.textContent = bar.dataset.label;
      tooltip.hidden = false;
      const rect = bar.getBoundingClientRect();
      const bounds = chart.getBoundingClientRect();
      tooltip.style.left = `${Math.max(0, Math.min(rect.x - bounds.x, bounds.width - tooltip.offsetWidth))}px`;
      tooltip.style.top = `${Math.max(0, rect.y - bounds.y - tooltip.offsetHeight - 8)}px`;
    };
    bar.addEventListener('pointerenter', show);
    bar.addEventListener('focus', show);
    bar.addEventListener('pointerleave', () => { tooltip.hidden = true; });
    bar.addEventListener('blur', () => { tooltip.hidden = true; });
    bar.addEventListener('keydown', event => {
      if (event.key === 'Escape') tooltip.hidden = true;
    });
  });
}

function renderAdaptation() {
  const x = time => 60 + time / 1.6 * 440;
  const y = sr => 285 - sr / 100 * 235;
  const seriesColors = ['#2FA7A0', '#7d8796'];
  const curves = results.adaptation.series.map((series, index) => {
    const path = series.points.map(([time, sr], i) => `${i ? 'L' : 'M'}${x(time)} ${y(sr)}`).join(' ');
    return `<path class="curve-line" d="${path}" stroke="${seriesColors[index]}" ${index ? 'stroke-dasharray="7 5"' : ''}/>`;
  }).join('');
  const markers = results.adaptation.series.map((series, index) => `<g><path class="crossing-mark" d="M${x(series.crossing)} ${y(80)}V285" stroke="${seriesColors[index]}"/><circle cx="${x(series.crossing)}" cy="${y(80)}" r="5" fill="${seriesColors[index]}"/><text x="${x(series.crossing)}" y="${y(100) + 15}" text-anchor="middle">${series.crossing.toFixed(2)} h</text></g>`).join('');
  const ticks = [0, .5, 1, 1.5].map(time => `<text x="${x(time)}" y="311" text-anchor="middle">${time}</text>`).join('');
  document.querySelector('#adaptation-chart').innerHTML = `<svg class="experiment-chart" viewBox="0 0 520 348" role="img" aria-label="Fine-tuning reaches 80 percent training success in 0.24 hours, versus 1.27 hours from scratch: 5.3 times faster"><defs><clipPath id="adaptation-clip"><rect id="adaptation-reveal" x="60" y="45" width="0" height="240"/></clipPath></defs>${axes('Training time (h)', 'Training SR (%)')}${ticks}<line class="curve-threshold" x1="60" x2="500" y1="${y(80)}" y2="${y(80)}"/><g clip-path="url(#adaptation-clip)">${curves}</g><g id="adaptation-markers">${markers}</g></svg>`;
}

const frames = new WeakMap();
function stopAnimation(element) {
  cancelAnimationFrame(frames.get(element));
  element.dataset.animation = 'idle';
}

function animate(element, duration, update) {
  stopAnimation(element);
  element.dataset.animation = 'running';
  const started = performance.now();
  function frame(now) {
    const progress = reducedMotion.matches ? 1 : Math.min((now - started) / duration, 1);
    update(progress);
    if (progress < 1) frames.set(element, requestAnimationFrame(frame));
    else element.dataset.animation = 'complete';
  }
  update(reducedMotion.matches ? 1 : 0);
  frames.set(element, requestAnimationFrame(frame));
}

function updateNumbers(element, progress) {
  const eased = 1 - (1 - progress) ** 3;
  element.querySelectorAll('[data-count]').forEach(counter => {
    counter.textContent = (Number(counter.dataset.count) * eased).toFixed(Number(counter.dataset.digits));
  });
}

function updateScaling(progress) {
  document.querySelector('#scaling-chart').style.setProperty('--reveal', 1 - (1 - progress) ** 3);
  if (progress === 0) document.querySelector('.chart-tooltip').hidden = true;
}

function updateAdaptation(progress) {
  document.querySelector('#adaptation-reveal').setAttribute('width', 440 * progress);
  document.querySelector('#adaptation-markers').style.opacity = progress === 1 ? 1 : 0;
  document.querySelector('.adaptation-summary').style.opacity = progress === 1 ? 1 : 0;
}

function observeReplay(element, duration, update) {
  let armed = true;
  const play = () => animate(element, duration, update);
  update(reducedMotion.matches ? 1 : 0);
  new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        armed = true;
        stopAnimation(element);
        update(reducedMotion.matches ? 1 : 0);
      } else if (armed && entry.intersectionRatio >= .2) {
        armed = false;
        play();
      }
    }
  }, { threshold: [0, .2] }).observe(element);
}

renderCards();
renderTable();
renderScaling();
renderAdaptation();
for (const id of ['metric-cards', 'benchmark-table']) {
  const element = document.getElementById(id);
  observeReplay(element, 1100, progress => updateNumbers(element, progress));
}
observeReplay(document.querySelector('#scaling-chart'), 1400, updateScaling);
observeReplay(document.querySelector('#adaptation-chart'), 1800, updateAdaptation);
