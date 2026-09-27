import {
  activeInYear, evaluate, resultOptions, weekMonday, fare, rankFor, careerNow, entryStatus, DEFAULT_SETTINGS,
} from './engine.js';

const STORE = 'te-planner-v1';
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => (n < 0 ? '−' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TIER_SHORT = { slam: 'GS', finals: 'FIN', m1000: '1000', t500: '500', t250: '250', chall: 'CH', fut: 'ITF', sat: 'SAT', team: 'TEAM', junior: 'JR' };
const TIER_RANK = { slam: 0, finals: 1, m1000: 2, t500: 3, t250: 4, chall: 5, fut: 6, sat: 7, team: 8, junior: 9 };
const PRO_TIERS = ['slam', 'finals', 'm1000', 't500', 't250', 'chall', 'fut', 'sat', 'team'];
const CHIP_LIMIT = 12;

// Guide §8 Year 1 schedules (career guide, August 2026). Picks resolve against the live
// calendar by week + country + name; anything that no longer resolves is reported.
const TEMPLATES = {
  'y1-europe': { name: 'Year 1 — Europe base (guide §8)', tour: 'ATP', home: 5, picks: [
    [29, 'BE', 'M25'], [30, 'BE', 'M25'], [33, 'IT', 'M25'], [34, 'IT', 'M25'], [37, 'DE', 'M25'], [47, 'ES', 'M25'], [48, 'ES', 'M25']] },
  'y1-namerica': { name: 'Year 1 — North America base (guide §8)', tour: 'ATP', home: 1, picks: [
    [30, 'US', 'M25'], [31, 'US', 'M25'], [37, 'US', 'Cary'], [38, 'US', 'Columbus'], [43, 'US', 'Las Vegas'], [44, 'US', 'Charlottesville'], [45, 'US', 'M25'], [46, 'US', 'M15']] },
  'y1-mideast': { name: 'Year 1 — Middle East base (guide §8)', tour: 'ATP', home: 6, picks: [
    [26, 'IR', 'M15'], [27, 'IR', 'M15'], [33, 'IT', 'M25'], [34, 'IT', 'M25'], [37, 'TR', 'Istanbul'], [47, 'BH', 'Manama'], [48, 'TR', 'Antalya'], [49, 'TR', 'Antalya']] },
};

function loadTemplate(key) {
  const tp = TEMPLATES[key];
  const year = plan().year;
  const n = newPlan({ name: `${tp.name} ${year}`, tour: tp.tour, home: tp.home, year });
  const missing = [];
  for (const [w, cc, frag] of tp.picks) {
    const e = catalog.tours[tp.tour].events.find(x => x.week === w && x.country === cc && x.name.includes(frag) && activeInYear(x, year));
    if (e) n.picks[w] = { id: e.id, result: 'QF' }; else missing.push(`wk ${w} ${cc} ${frag}`);
  }
  S.plans.push(n); S.active = n.id; render();
  toast(missing.length ? `Loaded; not in calendar: ${missing.join(', ')}` : 'Template loaded');
}

let catalog, S;
const expanded = new Set();

function uid() { return Math.random().toString(36).slice(2, 9); }

function newPlan(over = {}) {
  const year = over.year ?? careerNow(catalog, S?.settings)?.year ?? 2023;
  return { id: uid(), name: `Season ${year}`, tour: 'ATP', year, home: 5, circuit: 'pro', picks: {}, rest: [], ...over };
}

function defaultState() {
  const p = newPlan();
  return {
    v: 1, plans: [p], active: p.id,
    settings: { ...DEFAULT_SETTINGS },
    filters: { tiers: ['slam', 'm1000', 't500', 't250', 'chall', 'fut'], surfaces: [1, 2, 3, 4, 5, 0], zone: 'all' },
  };
}

function load() {
  let st = null;
  try { st = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { st = null; }
  if (!st || st.v !== 1 || !st.plans?.length) st = defaultState();
  st.settings = { ...DEFAULT_SETTINGS, ...st.settings };
  const fromHash = readHash();
  if (fromHash) {
    fromHash.id = uid();
    fromHash.name = (fromHash.name || 'Shared plan') + ' (link)';
    st.plans.push(fromHash); st.active = fromHash.id;
    history.replaceState(null, '', location.pathname);
  }
  return st;
}
function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch { /* private window */ } }
function plan() { return S.plans.find(p => p.id === S.active) || S.plans[0]; }

function readHash() {
  const m = location.hash.match(/^#plan=(.+)$/);
  if (!m) return null;
  try { return JSON.parse(decodeURIComponent(escape(atob(m[1])))); } catch { return null; }
}
function planLink(p) {
  const { id, ...rest } = p;
  return `${location.origin}${location.pathname}#plan=${btoa(unescape(encodeURIComponent(JSON.stringify(rest))))}`;
}

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1800);
}

function zoneName(z) { return catalog.zones[z] || '?'; }
function surfName(t) { return catalog.surfaceTypes[t] || 'Unknown'; }

function eventsForWeek(p, week) {
  const tour = catalog.tours[p.tour];
  const f = S.filters;
  const home = Number(p.home);
  return tour.events.filter(e => e.week === week && activeInYear(e, p.year))
    .filter(e => f.tiers.includes(e.tier))
    .filter(e => f.surfaces.includes(e.surface.type || 0))
    .filter(e => f.zone === 'all' || (f.zone === 'home' ? e.zone === home : fare(catalog.fares, home, e.zone) <= Number(f.zone)))
    .sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || (a.zone === home ? 0 : 1) - (b.zone === home ? 0 : 1)
      || fare(catalog.fares, home, a.zone) - fare(catalog.fares, home, b.zone) || a.name.localeCompare(b.name));
}

// ---------- rendering ----------

function render() {
  const p = plan();
  const ev = evaluate(p, catalog, S.settings);
  renderPlans(p);
  renderControls(p);
  renderWeeks(p, ev);
  renderSummary(p, ev);
  save();
}

function renderPlans(p) {
  $('#plans').innerHTML = S.plans.map(x =>
    `<button class="tab" role="tab" aria-selected="${x.id === p.id}" data-plan="${x.id}">${esc(x.name)} <span class="muted small">${x.tour} ${x.year}</span></button>`).join('')
    + `<button class="btn ghost small" id="plan-next" title="New plan for the following season">+ Next season</button>`
    + `<button class="btn ghost small" id="plan-dup">Duplicate</button>`
    + `<button class="btn ghost small" id="plan-rename">Rename</button>`
    + (S.plans.length > 1 ? `<button class="btn ghost small" id="plan-del">Delete</button>` : '');
}

function renderControls(p) {
  $('#c-tour').value = p.tour;
  $('#c-year').value = p.year;
  $('#c-home').value = String(p.home);
  $('#c-circuit').value = p.circuit;
  $('#f-zone').value = S.filters.zone;
  for (const b of document.querySelectorAll('[data-tier]')) b.setAttribute('aria-pressed', S.filters.tiers.includes(b.dataset.tier));
  for (const b of document.querySelectorAll('[data-surf]')) b.setAttribute('aria-pressed', S.filters.surfaces.includes(Number(b.dataset.surf)));
  for (const [k, v] of Object.entries(S.settings)) {
    const el = document.getElementById('s-' + k);
    if (!el) continue;
    if (el.type === 'checkbox') el.checked = !!v; else el.value = v ?? '';
  }
  const c = careerNow(catalog, S.settings);
  $('#cw-year').value = c?.year ?? '';
  $('#cw-week').value = c?.week ?? '';
  $('#cw-src').textContent = c ? (c.source === 'set here' ? '' : `from ${c.source}`) : 'set it to enable the registration lockout';
}

function chip(e, p, picked) {
  const home = Number(p.home);
  const f = fare(catalog.fares, home, e.zone);
  const title = `${e.name} — ${e.type} (cat ${e.category}), ${surfName(e.surface.type)}${e.indoor ? ' indoor' : ''}, ${e.countryName}, ${zoneName(e.zone)}; draw ${e.drawSingles}; fare from home ${f}` + (e.weeks === 2 ? '; two weeks' : '');
  const st = entryStatus(e, S.settings.myRank);
  const cut = e.entry ? `; est. main-draw cutoff rank ${e.entry.cutoffRank}${e.entry.qualCutoffRank ? `, qualifying ${e.entry.qualCutoffRank}` : ''}` : '';
  return `<span class="ev${picked ? ' picked' : ''}${e.zone === home ? ' home' : ''}${st ? ' reach-' + st : ''}" title="${esc(title + cut)}">
    <button class="btn ghost" style="padding:0;border:0;display:inline-flex;gap:6px;align-items:center" data-pick="${e.id}" data-week="${e.week}">
      <span class="dot s-${e.surface.type || 0}"></span><span class="tier">${TIER_SHORT[e.tier]}</span><span class="nm">${esc(e.name)}</span><span class="z">${esc(e.country)}${e.weeks === 2 ? ' ·2w' : ''}</span>
    </button>
    <button class="btn ghost small" style="padding:0 2px;border:0;color:var(--ink-3)" data-info="${e.id}" aria-label="Details for ${esc(e.name)}">ⓘ</button>
  </span>`;
}

function renderWeeks(p, ev) {
  const c = careerNow(catalog, S.settings);
  const lockUntil = c && p.year === c.year ? c.week + S.settings.lockWeeks : 0;
  const pickByWeek = new Map(ev.picks.map(x => [x.week, x]));
  const legByWeek = new Map();
  for (const t of ev.trips) for (const l of t.legs) if (l.label !== 'Home') legByWeek.set(l.week, l);
  const flagsByWeek = new Map();
  for (const ch of ev.checks) if (ch.week) (flagsByWeek.get(ch.week) || flagsByWeek.set(ch.week, []).get(ch.week)).push(ch);
  let html = '', lastMonth = -1;
  for (let w = 1; w <= 52; w++) {
    const d = weekMonday(p.year, w);
    const month = d.getUTCMonth();
    const st = ev.state[w];
    const pk = pickByWeek.get(w);
    const cls = ['week'];
    if (month !== lastMonth) cls.push('month-start');
    if (w <= lockUntil && !(c && w <= c.week)) cls.push('locked');
    if (c && p.year === c.year && w === c.week) cls.push('current');
    lastMonth = month;
    let mode;
    if (st === 'play') mode = `<span class="tag">Play</span>`;
    else if (st === 'cont') mode = `<span class="tag">Play (wk 2)</span>`;
    else mode = `<span class="seg"><button data-mode="train" data-week="${w}" aria-pressed="${st === 'train'}">Train</button><button class="rest" data-mode="rest" data-week="${w}" aria-pressed="${st === 'rest'}">Rest</button></span>`;
    let body;
    if (st === 'cont') {
      body = `<div class="cont">Continues: ${esc(ev.pickAt[w].event.name)}, second week</div>`;
    } else {
      let list = eventsForWeek(p, w);
      if (pk && !list.includes(pk.event)) list = [pk.event, ...list];
      const shown = expanded.has(w) ? list : list.slice(0, CHIP_LIMIT);
      body = `<div class="events">${shown.map(e => chip(e, p, pk && pk.event.id === e.id)).join('')}${list.length > shown.length ? `<button class="more" data-more="${w}">+${list.length - shown.length} more</button>` : ''}${!list.length ? '<span class="muted small">No events match the filters.</span>' : ''}</div>`;
      if (pk) body += pickLine(p, pk, legByWeek.get(w));
    }
    const flags = (flagsByWeek.get(w) || []).filter(f => f.level !== 'info' || st === 'play')
      .map(f => `<span class="flag ${f.level}" title="${esc(f.src)}">${esc(f.msg)}</span>`).join(' ');
    html += `<div class="${cls.join(' ')}" id="wk-${w}"><div class="wk">Wk ${w}<span class="date">${MONTHS[month]} ${d.getUTCDate()}</span></div>
      <div class="mode">${mode}</div><div class="events-col">${body}${flags ? `<div class="pickline">${flags}</div>` : ''}</div></div>`;
  }
  $('#weeks').innerHTML = html;
}

function pickLine(p, pk, leg) {
  const opts = resultOptions(pk.event, pk.cat).map(o => `<option value="${o.key}"${o.key === pk.result ? ' selected' : ''}>${o.label}</option>`).join('');
  const legTxt = !leg ? '' : leg.stay ? 'Stays in country, no flight' : `${zoneName(leg.from)} → ${zoneName(leg.to)} <b>${money(leg.cost)}</b>`;
  return `<div class="pickline">
    <select data-result="${pk.week}" aria-label="Expected result">${opts}</select>
    <span class="kv">Pts <b>${pk.points}</b></span>
    <span class="kv">Net prize <b>${money(pk.prizeNet)}</b></span>
    <span class="kv">${surfName(pk.event.surface.type)}${pk.event.surface.speed != null ? ` (speed ${pk.event.surface.speed})` : ''}</span>
    ${legTxt ? `<span class="kv">${legTxt}</span>` : ''}
    <span class="kv">Register by <b>wk ${pk.registerBy}</b></span>
    ${entryTxt(pk)}
    <button class="btn ghost small" data-info="${pk.event.id}">Details</button>
  </div>`;
}

const ENTRY_LABEL = { direct: ['info', 'Likely direct entry'], borderline: ['warn', 'Borderline'], qualifying: ['warn', 'Likely qualifying'], out: ['bad', 'Likely can’t enter'] };
function entryTxt(pk) {
  const en = pk.event.entry;
  if (!en) return '';
  const pts = en.cutoffPoints != null ? ` (≈${en.cutoffPoints} pts)` : '';
  const tag = pk.entryStatus ? ` <span class="flag ${ENTRY_LABEL[pk.entryStatus][0]}">${ENTRY_LABEL[pk.entryStatus][1]}</span>` : '';
  return `<span class="kv" title="Model estimate from the calendar and category files${en.calibrated ? ', calibrated' : ''}">Cutoff ≈ <b>#${en.cutoffRank}</b>${pts}</span>${tag}`;
}

function renderSummary(p, ev) {
  const t = ev.totals;
  const snap = catalog.ranking;
  const rank = p.tour === snap?.tour && p.circuit === 'pro' ? rankFor(t.points, snap.points) : null;
  $('#stats').innerHTML = [
    ['Tournaments', t.events, `${t.playWeeks} weeks on court`],
    ['Training weeks', t.trainWeeks, `${t.restWeeks} rest weeks`],
    ['Trips', t.trips, `${t.interZoneLegs} inter-zone legs`],
    ['Travel', money(t.travel + t.hotel), t.hotel ? `fares ${money(t.travel)} + hotel ${money(t.hotel)}` : 'fares only'],
    ['Points', t.points, t.bestN ? `best ${t.bestN} of ${t.events}` : ''],
    ['Net prize', money(t.prizeNet), `balance ${money(t.balance)}`],
  ].map(([l, v, s]) => `<div class="stat"><div class="v">${v}</div><div class="l">${l}${s ? ` · <span class="muted">${s}</span>` : ''}</div></div>`).join('');
  $('#rank').innerHTML = rank ? `≈ rank <b>${rank}</b> if those were the only points, measured against the ${esc(snap.label)} ATP snapshot (${snap.points.length} players). Points age out over 52 weeks, so this is a single-season yardstick.` : '';
  const total = Object.values(t.surfaceWeeks).reduce((a, b) => a + b, 0) || 1;
  $('#surfbar').innerHTML = Object.entries(t.surfaceWeeks).map(([k, v]) => `<span class="s-${k}" style="width:${(100 * v / total).toFixed(1)}%" title="${surfName(+k)}: ${v} weeks"></span>`).join('');
  $('#surflegend').innerHTML = Object.entries(t.surfaceWeeks).map(([k, v]) => `<span><i class="s-${k}"></i>${surfName(+k)} ${v}</span>`).join('') || '<span class="muted">No tournaments yet.</span>';
  $('#checks').innerHTML = ev.checks.length ? ev.checks.map(c => `<li class="${c.level}">${c.week ? `<a href="#wk-${c.week}">Wk ${c.week}</a> · ` : ''}${esc(c.msg)}<span class="src">${esc(c.src)}</span></li>`).join('') : '<li>No issues.</li>';
  $('#trips').innerHTML = ev.trips.length ? `<tr><th>Weeks</th><th>Route</th><th class="r">Cost</th></tr>` + ev.trips.map(tr => {
    const route = [zoneName(Number(p.home)), ...tr.stops.map(s => s.event.name)].concat(S.settings.returnHome ? ['home'] : []).map(esc).join(' → ');
    return `<tr><td class="mono">${tr.start}${tr.end !== tr.start ? '–' + tr.end : ''}</td><td>${route}</td><td class="r mono">${money(tr.fare + tr.hotel)}</td></tr>`;
  }).join('') : '<tr><td class="muted">No trips yet.</td></tr>';
}

// ---------- drawer ----------

function openInfo(id) {
  const p = plan();
  const e = catalog.tours[p.tour].events.find(x => x.id === id);
  if (!e) return;
  const cat = catalog.tours[p.tour].categories[e.category];
  const home = Number(p.home);
  const opts = resultOptions(e, cat);
  const picked = p.picks[e.week]?.id === e.id;
  $('#d-title').innerHTML = `${esc(e.name)}<div class="muted small">${esc(e.type)} · category ${e.category} · week ${e.week}${e.weeks === 2 ? '–' + (e.week + 1) : ''}</div>`;
  $('#d-content').innerHTML = `
    <div><button class="btn ${picked ? '' : 'primary'}" data-pick="${e.id}" data-week="${e.week}">${picked ? 'Remove from plan' : 'Add to plan'}</button></div>
    <dl class="kvgrid">
      <dt>Location</dt><dd>${esc(e.countryName)} (${esc(e.country)}), ${zoneName(e.zone)}</dd>
      <dt>Fare</dt><dd>${money(fare(catalog.fares, home, e.zone))} from ${zoneName(home)}, ${money(fare(catalog.fares, e.zone, home))} back</dd>
      <dt>Surface</dt><dd><span class="dot s-${e.surface.type || 0}" style="display:inline-block;width:9px;height:9px;border-radius:50%"></span> ${surfName(e.surface.type)}${e.indoor ? ', indoor' : ''}${e.surface.asset ? ` · asset “${esc(e.surface.asset)}”` : ''}${e.surface.speed != null ? ` · SurfaceSpeed ${e.surface.speed}` : ''} <span class="ev-tag">${e.surface.evidence}</span></dd>
      <dt>Draw</dt><dd>${e.drawSingles} singles · ${e.drawDoubles} doubles${e.weeks === 2 ? ' · two weeks <span class="ev-tag">inferred</span>' : ''}</dd>
      <dt>Field strength</dt><dd>${cat.topPresence != null ? `TopPresence ${cat.topPresence}` : '—'} <span class="muted small">(share of top players who enter)</span></dd>
      <dt>Wildcards</dt><dd>${cat.wildcards ?? '—'}${cat.seeds ? ` · ${cat.seeds} seeds` : ''}</dd>
      <dt>Qualifying</dt><dd>${cat.qualifRounds ? `${cat.qualifRounds} rounds` : '—'}${cat.qualifPoints?.length ? ` · points ${cat.qualifPoints.join(' / ')}` : ''}</dd>
      <dt>Tax</dt><dd>${cat.taxFinal}% main draw, ${cat.taxQualif}% qualifying</dd>
      <dt>Purse</dt><dd>${e.prize ? money(e.prize.total) : '—'}</dd>
      ${e.entry ? `<dt>Entry (est.)</dt><dd>Main draw ≈ rank <b>${e.entry.cutoffRank}</b>${e.entry.cutoffPoints != null ? ` (≈${e.entry.cutoffPoints} pts)` : ''}${e.entry.qualCutoffRank ? ` · qualifying ≈ rank ${e.entry.qualCutoffRank}${e.entry.qualCutoffPoints != null ? ` (≈${e.entry.qualCutoffPoints} pts)` : ''}` : ''}<br><span class="muted small">${e.entry.direct} direct places = draw ${e.entry.draw} − ${e.entry.qualifiers} qualifiers − ${e.entry.wildcards} wildcards · ${e.entry.weekEvents} same-level event(s) that week</span> <span class="ev-tag">${e.entry.calibrated ? 'model, calibrated' : 'model estimate'}</span></dd>` : ''}
      ${e.year ? `<dt>Years held</dt><dd>${esc(JSON.stringify(e.year))} <span class="ev-tag">inferred</span></dd>` : ''}
    </dl>
    <table class="rounds"><tr><th>Result</th><th>Points</th><th>Prize</th><th>Net</th></tr>
      ${opts.map(o => `<tr><td>${o.label}</td><td>${o.points}</td><td>${o.prize ? money(o.prize) : '—'}</td><td>${o.prize ? money(o.prize * (1 - (cat.taxFinal || 0) / 100)) : '—'}</td></tr>`).join('')}
    </table>
    <p class="small muted">Source: ${esc(catalog.tours[p.tour].calendarFrom)} Tour.${p.tour}.ini [${esc(e.section)}]; ${esc(catalog.tours[p.tour].categoriesFrom)} TourCategory.${p.tour}.ini [Category${String(e.category).padStart(2, '0')}]. <a href="explore/${p.tour.toLowerCase()}/${e.slug}.html">Reference page</a></p>`;
  $('#drawer').classList.add('open'); $('#scrim').classList.add('open');
}
function closeInfo() { $('#drawer').classList.remove('open'); $('#scrim').classList.remove('open'); }

// ---------- actions ----------

function togglePick(id, week) {
  const p = plan();
  week = Number(week);
  if (p.picks[week]?.id === id) delete p.picks[week];
  else {
    const e = catalog.tours[p.tour].events.find(x => x.id === id);
    p.picks[week] = { id, result: e && e.tier === 'slam' ? 'R64' : 'QF' };
    p.rest = (p.rest || []).filter(w => w !== week && !(e?.weeks === 2 && w === week + 1));
    if (e?.weeks === 2) delete p.picks[week + 1];
  }
  render();
}

function markdown(p, ev) {
  const t = ev.totals;
  const lines = [
    `# ${p.name}`, '',
    `${p.tour} ${p.circuit === 'junior' ? 'junior' : 'pro'} · ${p.year} · Coach Center: ${zoneName(Number(p.home))} · generated ${new Date().toISOString().slice(0, 10)} from the XKT profile mod stack (${catalog.layers.join(' → ')}).`, '',
    `| Week | Plan | Event | Tier | Surface | Where | Expected | Pts | Net prize | Leg |`,
    `|---|---|---|---|---|---|---|---|---|---|`,
  ];
  const legByWeek = new Map();
  for (const tr of ev.trips) for (const l of tr.legs) if (l.label !== 'Home') legByWeek.set(l.week, l);
  for (let w = 1; w <= 52; w++) {
    const st = ev.state[w];
    const d = weekMonday(p.year, w);
    const wk = `${w} (${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()})`;
    if (st === 'play') {
      const pk = ev.picks.find(x => x.week === w);
      const leg = legByWeek.get(w);
      lines.push(`| ${wk} | **Play** | ${pk.event.name} | ${pk.event.type} | ${surfName(pk.event.surface.type)} | ${pk.event.countryName} (${zoneName(pk.event.zone)}) | ${pk.resultLabel} | ${pk.points} | ${money(pk.prizeNet)} | ${leg ? `${zoneName(leg.from)}→${zoneName(leg.to)} ${money(leg.cost)}` : ''} |`);
    } else if (st === 'cont') lines.push(`| ${wk} | Play | ↳ ${ev.pickAt[w].event.name} (week 2) | | | | | | | |`);
    else lines.push(`| ${wk} | ${st === 'rest' ? 'Rest' : 'Train'} | | | | | | | | |`);
  }
  lines.push('', `**Totals:** ${t.events} tournaments (${t.playWeeks} weeks), ${t.trainWeeks} training weeks, ${t.restWeeks} rest weeks, ${t.trips} trips; travel ${money(t.travel + t.hotel)}; ${t.points} points${t.bestN ? ` (best ${t.bestN})` : ''}; net prize ${money(t.prizeNet)}.`, '');
  const s = S.settings;
  lines.push(`**Travel assumptions (unverified in game):** ${s.travelers} fare(s) per leg × ${s.fareMult}; return leg ${s.returnHome ? 'charged' : 'not charged'}; on the road across gaps ≤ ${s.maxGap} weeks; hotel ${s.hotel ? `${s.hotelNights} nights × ${catalog.hotelBasePrice} × ${s.hotelMult}` : 'excluded'}.`, '');
  if (ev.checks.length) {
    lines.push('**Checks:**', '');
    for (const c of ev.checks) lines.push(`- ${c.level === 'bad' ? '⛔' : c.level === 'warn' ? '⚠️' : 'ℹ️'} ${c.week ? `Wk ${c.week}: ` : ''}${c.msg} *(${c.src})*`);
  }
  return lines.join('\n') + '\n';
}

async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch {
    const ta = document.createElement('textarea'); ta.value = text; document.body.append(ta); ta.select();
    try { document.execCommand('copy'); toast(msg); } catch { toast('Copy failed'); }
    ta.remove();
  }
}

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function bind() {
  document.addEventListener('click', ev => {
    const b = ev.target.closest('button, a');
    if (!b) return;
    const d = b.dataset;
    const p = plan();
    if (d.pick) { togglePick(d.pick, d.week); if ($('#drawer').classList.contains('open')) openInfo(d.pick); }
    else if (d.info) openInfo(d.info);
    else if (d.more) { expanded.add(Number(d.more)); render(); }
    else if (d.mode) {
      const w = Number(d.week);
      p.rest = (p.rest || []).filter(x => x !== w);
      if (d.mode === 'rest') p.rest.push(w);
      render();
    }
    else if (d.tier) { S.filters.tiers = toggleIn(S.filters.tiers, d.tier); render(); }
    else if (d.surf) { S.filters.surfaces = toggleIn(S.filters.surfaces, Number(d.surf)); render(); }
    else if (d.plan) { S.active = d.plan; expanded.clear(); render(); }
    else if (b.id === 'plan-next') { const n = newPlan({ year: p.year + 1, tour: p.tour, home: p.home, circuit: p.circuit }); S.plans.push(n); S.active = n.id; render(); }
    else if (b.id === 'plan-dup') { const n = { ...structuredClone(p), id: uid(), name: p.name + ' (copy)' }; S.plans.push(n); S.active = n.id; render(); }
    else if (b.id === 'plan-rename') { const nm = prompt('Plan name', p.name); if (nm) { p.name = nm; render(); } }
    else if (b.id === 'plan-del') { if (confirm(`Delete “${p.name}”?`)) { S.plans = S.plans.filter(x => x.id !== p.id); S.active = S.plans[0].id; render(); } }
    else if (b.id === 'clear') { if (confirm('Clear every pick and rest week in this plan?')) { p.picks = {}; p.rest = []; render(); } }
    else if (b.id === 'x-md') copy(markdown(p, evaluate(p, catalog, S.settings)), 'Markdown copied');
    else if (b.id === 'x-link') copy(planLink(p), 'Link copied');
    else if (b.id === 'x-json') download(`${p.name.replace(/[^\w-]+/g, '_')}.json`, JSON.stringify(p, null, 2), 'application/json');
    else if (b.id === 'x-import') $('#import-file').click();
    else if (b.id === 'd-close') closeInfo();
    else if (b.id === 'theme') { const r = document.documentElement; const nx = r.dataset.theme === 'dark' ? 'light' : 'dark'; r.dataset.theme = nx; try { localStorage.setItem('te-theme', nx); } catch {} }
  });
  $('#scrim').addEventListener('click', closeInfo);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeInfo(); });
  document.addEventListener('change', ev => {
    const el = ev.target, p = plan();
    if (el.dataset.result) { p.picks[el.dataset.result].result = el.value; render(); return; }
    if (el.id === 'c-tour') { if (Object.keys(p.picks).length && !confirm('Switching tour clears this plan’s picks. Continue?')) { el.value = p.tour; return; } p.tour = el.value; p.picks = {}; }
    else if (el.id === 'c-year') {
      const y = Number(el.value) || p.year;
      if (/^Season \d{4}$/.test(p.name)) p.name = `Season ${y}`;
      p.year = y;
    }
    else if (el.id === 'c-home') p.home = Number(el.value);
    else if (el.id === 'c-circuit') {
      p.circuit = el.value;
      S.filters.tiers = el.value === 'junior' ? ['junior', 'fut', 'sat'] : S.filters.tiers.filter(t => t !== 'junior');
      if (!S.filters.tiers.length) S.filters.tiers = PRO_TIERS.slice(0, 6);
    }
    else if (el.id === 'f-zone') S.filters.zone = el.value;
    else if (el.id === 'cw-year' || el.id === 'cw-week') {
      S.settings.careerYear = Number($('#cw-year').value) || null;
      S.settings.careerWeek = Math.min(52, Math.max(1, Number($('#cw-week').value) || 0)) || null;
    }
    else if (el.id === 'template') { if (el.value) loadTemplate(el.value); el.value = ''; return; }
    else if (el.id.startsWith('s-')) { const k = el.id.slice(2); S.settings[k] = el.type === 'checkbox' ? el.checked : k === 'myRank' ? (Number(el.value) || null) : Number(el.value); }
    else if (el.id === 'import-file') {
      const f = el.files?.[0]; if (!f) return;
      f.text().then(txt => { try { const n = JSON.parse(txt); n.id = uid(); S.plans.push(n); S.active = n.id; render(); toast('Plan imported'); } catch { toast('Not a plan file'); } });
      el.value = ''; return;
    }
    else return;
    render();
  });
}
function toggleIn(arr, v) { return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]; }

function buildStaticControls() {
  $('#c-home').innerHTML = Object.entries(catalog.zones).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  $('#tiers').innerHTML = catalog.tiers.map(t => `<button class="toggle" data-tier="${t.key}">${t.label}</button>`).join('');
  $('#surfs').innerHTML = [1, 2, 3, 4, 5, 0].map(k => `<button class="toggle" data-surf="${k}"><span class="dot s-${k}" style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px"></span>${k ? catalog.surfaceTypes[k] : 'Unknown'}</button>`).join('');
  $('#fare-matrix').innerHTML = `<tr><th>From \\ to</th>${Object.keys(catalog.zones).map(z => `<th class="r">${z}</th>`).join('')}</tr>` +
    catalog.fares.map((row, i) => `<tr><td>${i + 1} ${catalog.zones[i + 1]}</td>${row.map(v => `<td class="r mono">${v}</td>`).join('')}</tr>`).join('');
}

async function main() {
  try { const th = localStorage.getItem('te-theme'); if (th) document.documentElement.dataset.theme = th; } catch {}
  catalog = await (await fetch('data/catalog.json', { cache: 'no-store' })).json();
  S = load();
  buildStaticControls();
  bind();
  render();
  const c = careerNow(catalog, S.settings);
  if (c && plan().year === c.year) document.getElementById(`wk-${Math.max(1, c.week - 1)}`)?.scrollIntoView({ block: 'start' });
}
main();
