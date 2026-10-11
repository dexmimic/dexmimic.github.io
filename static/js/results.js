const results = await fetch('static/assets/results.json').then(response => response.json());
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const colors = ['#5B8FF9', '#2FA7A0', '#9B82C4'];
const levels = ['L1', 'L2', 'L3'];
const adaptationX = time => 60 + time / 1.6 * 440;
const adaptationY = sr => 285 - sr / 100 * 235;

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
      <p>Object translation and rotation errors. Lower is better for both metrics.</p></article>`;
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

function firstReachedTime(points, target) {
  // Ignore percentage conversion roundoff at an existing sample.
  const index = points.findIndex(([, sr]) => sr >= target - 1e-10);
  if (index < 0) return null;
  if (index === 0) return points[0][0];
  const [t0, sr0] = points[index - 1];
  const [t1, sr1] = points[index];
  return t0 + (Math.min(target, sr1) - sr0) / (sr1 - sr0) * (t1 - t0);
}

function renderAdaptation() {
  const x = adaptationX;
  const y = adaptationY;
  const seriesColors = ['#2FA7A0', '#7d8796'];
  const curves = results.adaptation.series.map((series, index) => {
    const path = series.points.map(([time, sr], i) => `${i ? 'L' : 'M'}${x(time)} ${y(sr)}`).join(' ');
    return `<path class="curve-line" d="${path}" stroke="${seriesColors[index]}" ${index ? 'stroke-dasharray="7 5"' : ''}/>`;
  }).join('');
  const markers = results.adaptation.series.map((series, index) => `<g><path class="crossing-mark" d="M${x(series.crossing)} ${y(80)}V285" stroke="${seriesColors[index]}"/><circle cx="${x(series.crossing)}" cy="${y(80)}" r="5" fill="${seriesColors[index]}"/><text x="${x(series.crossing)}" y="${y(100) + 15}" text-anchor="middle">${series.crossing.toFixed(2)} h</text></g>`).join('');
  const probePoints = seriesColors.map(color => `<circle class="probe-point" r="6" fill="${color}"/>`).join('');
  const probeTimes = results.adaptation.series.map(series => `<span>${series.name}</span><b class="probe-time"></b>`).join('');
  const ticks = [0, .5, 1, 1.5].map(time => `<text x="${x(time)}" y="311" text-anchor="middle">${time}</text>`).join('');
  const chart = document.querySelector('#adaptation-chart');
  chart.innerHTML = `<svg class="experiment-chart" viewBox="0 0 520 348" role="group" aria-label="Fine-tuning reaches 80 percent training success in 0.24 hours, versus 1.27 hours from scratch: 5.3 times faster"><defs><clipPath id="adaptation-clip"><rect id="adaptation-reveal" x="60" y="45" width="0" height="240"/></clipPath></defs>${axes('Training time (h)', 'Training SR (%)')}${ticks}<line class="curve-threshold" x1="60" x2="500" y1="${y(80)}" y2="${y(80)}"/><g clip-path="url(#adaptation-clip)">${curves}</g><g id="adaptation-markers">${markers}</g><g class="adaptation-probe" visibility="hidden"><line class="probe-threshold" x1="60" x2="500"/>${probePoints}</g><rect class="adaptation-hitbox" x="60" y="50" width="440" height="235" fill="transparent" tabindex="0" role="slider" aria-label="Training success rate" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="80"/></svg><div class="chart-tooltip adaptation-tooltip" role="status" hidden><strong class="probe-target"></strong>${probeTimes}</div>`;
  bindAdaptationProbe(chart);
}

function showAdaptationProbe(chart, target) {
  const tooltip = chart.querySelector('.adaptation-tooltip');
  const line = chart.querySelector('.probe-threshold');
  line.setAttribute('y1', adaptationY(target));
  line.setAttribute('y2', adaptationY(target));
  chart.querySelector('.adaptation-probe').setAttribute('visibility', 'visible');
  chart.querySelector('.probe-target').textContent = `Training SR: ${target.toFixed(1)}%`;
  chart.querySelector('.adaptation-hitbox').setAttribute('aria-valuenow', target);
  const points = chart.querySelectorAll('.probe-point');
  const times = chart.querySelectorAll('.probe-time');
  results.adaptation.series.forEach((series, index) => {
    const time = firstReachedTime(series.points, target);
    times[index].textContent = time === null ? 'Not reached' : `${time.toFixed(2)} h`;
    points[index].setAttribute('visibility', time === null ? 'hidden' : 'visible');
    if (time === null) return;
    points[index].setAttribute('cx', adaptationX(time));
    points[index].setAttribute('cy', adaptationY(time === series.points[0][0] ? series.points[0][1] : target));
  });
  tooltip.hidden = false;
  const bounds = chart.getBoundingClientRect();
  const svg = chart.querySelector('svg').getBoundingClientRect();
  tooltip.style.left = `${(bounds.width - tooltip.offsetWidth) / 2}px`;
  tooltip.style.top = `${Math.max(0, svg.top - bounds.top + adaptationY(target) / 348 * svg.height - tooltip.offsetHeight - 8)}px`;
}

function clearAdaptationProbe(chart) {
  chart.querySelector('.adaptation-probe').setAttribute('visibility', 'hidden');
  chart.querySelector('.adaptation-tooltip').hidden = true;
}

function bindAdaptationProbe(chart) {
  const plot = chart.querySelector('.adaptation-hitbox');
  let target = 80;
  const show = rate => { target = rate; showAdaptationProbe(chart, target); };
  const followPointer = event => {
    const bounds = plot.getBoundingClientRect();
    show(Math.round(Math.max(0, Math.min(100, 100 - (event.clientY - bounds.top) / bounds.height * 100)) * 10) / 10);
  };
  plot.addEventListener('pointerenter', followPointer);
  plot.addEventListener('pointermove', followPointer);
  plot.addEventListener('pointerleave', () => clearAdaptationProbe(chart));
  plot.addEventListener('focus', () => show(80));
  plot.addEventListener('blur', () => clearAdaptationProbe(chart));
  plot.addEventListener('keydown', event => {
    if (event.key === 'Escape') clearAdaptationProbe(chart);
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      show(Math.max(0, Math.min(100, target + (event.key === 'ArrowUp' ? 1 : -1))));
    }
  });
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
  if (progress === 0) document.querySelector('#scaling-chart .chart-tooltip').hidden = true;
}

function updateAdaptation(progress) {
  document.querySelector('#adaptation-reveal').setAttribute('width', 440 * progress);
  document.querySelector('#adaptation-markers').style.opacity = progress === 1 ? 1 : 0;
  document.querySelector('.adaptation-summary').style.opacity = progress === 1 ? 1 : 0;
  if (progress === 0) clearAdaptationProbe(document.querySelector('#adaptation-chart'));
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
