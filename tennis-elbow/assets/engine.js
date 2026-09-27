// Pure planning logic: no DOM. Imported by planner.js and by tests/engine.test.mjs.

export const ROUND_NAMES = { 2: 'F', 4: 'SF', 8: 'QF', 16: 'R16', 32: 'R32', 64: 'R64', 128: 'R128' };
export const SURFACE_KEYS = [1, 2, 3, 4, 5];

export function roundsFor(draw) {
  if (!draw || draw < 2) return 0;
  return Math.ceil(Math.log2(draw));
}

/** Result options for an event, winner first. Index i matches EntryPoints[i] and PrizeMoney rounds[i]. */
export function resultOptions(event, cat) {
  const n = roundsFor(event.drawSingles);
  const opts = [];
  for (let i = 0; i <= n; i++) {
    const players = 2 ** i; // loser of the round contested by `players * 2`... see label below
    const key = i === 0 ? 'W' : ROUND_NAMES[2 ** i] || `R${2 ** i}`;
    const label = i === 0 ? 'Winner' : `Lost ${key}`;
    opts.push({ key, index: i, label, points: cat.points[i] ?? 0, prize: event.prize?.rounds?.[i] ?? 0, players });
  }
  opts.push({ key: 'QL', index: -1, label: 'Lost in qualifying', points: cat.qualifPoints?.[1] ?? 0, prize: 0 });
  return opts;
}

export function resultFor(event, cat, key) {
  const opts = resultOptions(event, cat);
  return opts.find(o => o.key === key) || opts[opts.length - 2] || opts[0];
}

export function netPrize(gross, cat, qualifying = false) {
  const tax = (qualifying ? cat.taxQualif : cat.taxFinal) || 0;
  return Math.round(gross * (1 - tax / 100));
}

/** Year rules: YearModulo/YearModulo+ and YearPeriod ("-1978 1980 1984-1990 2022-"). */
export function activeInYear(event, year) {
  const r = event.year;
  if (!r || year == null) return true;
  if (r.modulo) {
    const m = Math.abs(r.modulo);
    const hit = (((year + (r.offset || 0)) % m) + m) % m === 0;
    if (r.modulo > 0 ? !hit : hit) return false;
  }
  if (r.period) {
    const ok = r.period.split(/\s+/).filter(Boolean).some(tok => {
      let m;
      if ((m = tok.match(/^-(\d{4})$/))) return year <= +m[1];
      if ((m = tok.match(/^(\d{4})-$/))) return year >= +m[1];
      if ((m = tok.match(/^(\d{4})-(\d{4})$/))) return year >= +m[1] && year <= +m[2];
      if ((m = tok.match(/^(\d{4})$/))) return year === +m[1];
      return false;
    });
    if (!ok) return false;
  }
  return true;
}

/** Monday of ISO week `week` in `year` (UTC). Used only for date labels. */
export function weekMonday(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  return monday;
}

export function fare(fares, from, to) {
  if (!from || !to) return 0;
  return fares[from - 1]?.[to - 1] ?? 0;
}

export const DEFAULT_SETTINGS = {
  travelers: 1,        // how many fares one trip leg costs (player alone = 1)
  fareMult: 1,         // plane-class scaling; the file gives only the base matrix
  returnHome: true,    // charge the final leg back to the Coach Center
  maxGap: 0,           // stay on the road across gaps of up to N non-tournament weeks
  sameCountryFare: false, // charge a flight between back-to-back events in the same country
  hotel: false,        // include a hotel estimate
  hotelNights: 7,
  hotelMult: 1,
  lockWeeks: 4,        // registration closes this many weeks ahead
  myRank: null,        // the player's entry rank, for main-draw / qualifying estimates
  careerYear: null,    // the career's current season and week; null = use catalog.career (local builds)
  careerWeek: null,
  restEvery: 10,       // guide: rest at least half a week every 10 weeks
  motivationGap: 5,    // guide: at least one event a month once competing
  maxStreak: 3,        // consecutive tournament weeks before a fatigue warning
};

/**
 * Evaluate a plan.
 * plan = { tour, year, home, circuit, picks: {week: {id, result}}, rest: [weeks] }
 */
export function evaluate(plan, catalog, settingsIn = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...settingsIn };
  const tour = catalog.tours[plan.tour];
  const byId = new Map(tour.events.map(e => [e.id, e]));
  const cats = tour.categories;
  const fares = catalog.fares;
  const rest = new Set((plan.rest || []).map(Number));
  const checks = [];
  const add = (level, week, msg, src) => checks.push({ level, week, msg, src });

  // Picks in week order; drop anything that no longer resolves (calendar changed) and report it.
  const picks = [];
  for (const [wk, p] of Object.entries(plan.picks || {})) {
    const e = byId.get(p.id);
    const week = Number(wk);
    if (!e) { add('bad', week, `Picked event ${p.id} is not in the current calendar.`, 'mod-data'); continue; }
    if (!activeInYear(e, plan.year)) add('bad', week, `${e.name} is not held in ${plan.year}.`, 'mod-data (YearModulo)');
    const cat = cats[e.category];
    const res = resultFor(e, cat, p.result);
    picks.push({ week, event: e, cat, result: res.key, resultLabel: res.label, points: res.points,
      prizeGross: res.prize, prizeNet: netPrize(res.prize, cat), qualifying: res.key === 'QL' });
  }
  picks.sort((a, b) => a.week - b.week);

  // Week states, including the second week of two-week events.
  const state = Array(53).fill('train');
  const pickAt = Array(53).fill(null);
  for (const p of picks) {
    for (let k = 0; k < p.event.weeks; k++) {
      const w = p.week + k;
      if (w > 52) continue;
      if (pickAt[w] && k > 0) add('bad', w, `${p.event.name} runs into week ${w}, which already has ${pickAt[w].event.name}.`, 'inferred (two-week events)');
      state[w] = k === 0 ? 'play' : 'cont';
      pickAt[w] = pickAt[w] || p;
    }
  }
  for (const w of rest) if (state[w] === 'train') state[w] = 'rest';
  for (const w of rest) if (state[w] !== 'rest') add('warn', w, `Week ${w} is marked rest but has a tournament.`, 'plan');

  // Trips: consecutive tournament stops share a trip; gaps up to maxGap stay on the road.
  const trips = [];
  let cur = null;
  for (const p of picks) {
    const start = p.week, end = p.week + p.event.weeks - 1;
    if (cur && start - cur.end - 1 <= settings.maxGap) {
      cur.stops.push(p); cur.end = end;
    } else {
      cur = { stops: [p], start, end };
      trips.push(cur);
    }
  }
  const home = Number(plan.home);
  let travelTotal = 0, hotelTotal = 0, legs = 0, interZoneLegs = 0;
  for (const t of trips) {
    t.legs = [];
    let at = home;
    let prev = null;
    for (const s of t.stops) {
      const stay = prev && prev.event.country === s.event.country && !settings.sameCountryFare;
      t.legs.push({ from: at, to: s.event.zone, fare: stay ? 0 : fare(fares, at, s.event.zone), week: s.week, label: s.event.name, stay });
      at = s.event.zone; prev = s;
    }
    if (settings.returnHome) t.legs.push({ from: at, to: home, fare: fare(fares, at, home), week: t.end, label: 'Home' });
    for (const l of t.legs) {
      l.cost = Math.round(l.fare * settings.travelers * settings.fareMult);
      if (l.from !== l.to) interZoneLegs++;
      if (!l.stay) legs++;
    }
    t.fare = t.legs.reduce((a, l) => a + l.cost, 0);
    const tWeeks = t.stops.reduce((a, s) => a + s.event.weeks, 0);
    t.hotel = settings.hotel ? Math.round(tWeeks * settings.hotelNights * (catalog.hotelBasePrice || 0) * settings.hotelMult * settings.travelers) : 0;
    travelTotal += t.fare; hotelTotal += t.hotel;
  }

  // Registration window.
  const career = careerNow(catalog, settings);
  for (const p of picks) {
    p.registerBy = p.week - settings.lockWeeks - 1;
    if (career && plan.year === career.year && p.week <= career.week + settings.lockWeeks) {
      add('bad', p.week, `${p.event.name}: registration is closed (current week ${career.week}; entries close ${settings.lockWeeks} weeks out).`, 'game doc');
    } else if (career && plan.year === career.year && p.registerBy <= career.week + 1) {
      add('warn', p.week, `${p.event.name}: register now (by week ${p.registerBy}).`, 'game doc');
    }
  }

  // Entry: compare the player's entry rank with the modeled cutoffs.
  if (settings.myRank) {
    for (const p of picks) {
      p.entryStatus = entryStatus(p.event, settings.myRank);
      const en = p.event.entry;
      if (p.entryStatus === 'out') add('bad', p.week, `${p.event.name}: entry rank ${settings.myRank} is probably outside even the qualifying draw (model cutoff ≈ ${en.qualCutoffRank || en.cutoffRank}).`, 'entry model estimate');
      else if (p.entryStatus === 'qualifying') add('warn', p.week, `${p.event.name}: probably qualifying, not main draw (model main-draw cutoff ≈ ${en.cutoffRank}).`, 'entry model estimate');
      else if (p.entryStatus === 'borderline') add('info', p.week, `${p.event.name}: borderline for direct entry (model cutoff ≈ ${en.cutoffRank}).`, 'entry model estimate');
    }
  }

  // Rest rule: every run of `restEvery` weeks needs a rest week (guide heuristic).
  let runStart = 1;
  for (let w = 1; w <= 53; w++) {
    if (w <= 52 && state[w] !== 'rest') continue;
    const len = w - runStart;
    if (len >= settings.restEvery) {
      const need = Math.floor(len / settings.restEvery);
      add('warn', runStart + settings.restEvery - 1, `Weeks ${runStart}–${w - 1}: ${len} weeks without a rest week. Mark ${need === 1 ? 'one' : need} (at least half a week every ${settings.restEvery} weeks).`, 'guide heuristic (developer forum)');
    }
    runStart = w + 1;
  }

  // Motivation: once competing, keep at least one event a month.
  for (let i = 1; i < picks.length; i++) {
    const prevEnd = picks[i - 1].week + picks[i - 1].event.weeks - 1;
    const gap = picks[i].week - prevEnd - 1;
    if (gap > settings.motivationGap) add('warn', picks[i].week, `${gap} weeks without a tournament before ${picks[i].event.name}; motivation decays without competition.`, 'guide heuristic (§6, §7)');
  }
  if (picks.length) {
    const lastEnd = picks[picks.length - 1].week + picks[picks.length - 1].event.weeks - 1;
    if (52 - lastEnd > settings.motivationGap + 3) add('info', lastEnd, `${52 - lastEnd} weeks without a tournament to the end of the season.`, 'guide heuristic');
  }

  // Fatigue: consecutive tournament weeks.
  let streak = 0;
  for (let w = 1; w <= 53; w++) {
    if (w <= 52 && (state[w] === 'play' || state[w] === 'cont')) { streak++; continue; }
    if (streak > settings.maxStreak) add('warn', w - 1, `${streak} consecutive tournament weeks ending week ${w - 1}; Short Term Form will not recover.`, 'guide heuristic (§5)');
    streak = 0;
  }

  // Surface switches without a training week between.
  for (let i = 1; i < picks.length; i++) {
    const a = picks[i - 1], b = picks[i];
    const gap = b.week - (a.week + a.event.weeks);
    const sa = a.event.surface.type, sb = b.event.surface.type;
    if (sa && sb && sa !== sb && gap <= 0) add('info', b.week, `Surface change straight from ${catalog.surfaceTypes[sa]} to ${catalog.surfaceTypes[sb]} (${b.event.name}).`, 'guide heuristic (§7 surface skills)');
  }

  // Best-N ranking cap.
  const bestN = plan.circuit === 'junior' ? tour.bestOf.juniorSingles : tour.bestOf.singles;
  const pts = picks.map(p => p.points).sort((a, b) => b - a);
  const counted = bestN ? pts.slice(0, bestN) : pts;
  if (bestN && picks.length > bestN) add('info', null, `${picks.length} singles events planned; only the best ${bestN} count toward the ranking.`, 'mod-data (GameSys NbBestTrn)');

  const surfaceWeeks = {};
  for (let w = 1; w <= 52; w++) {
    const p = pickAt[w];
    if (p) { const t = p.event.surface.type || 0; surfaceWeeks[t] = (surfaceWeeks[t] || 0) + 1; }
  }
  const count = s => state.slice(1).filter(x => x === s).length;
  const prizeNet = picks.reduce((a, p) => a + p.prizeNet, 0);
  const totals = {
    events: picks.length,
    playWeeks: count('play') + count('cont'),
    trainWeeks: count('train'),
    restWeeks: count('rest'),
    trips: trips.length, legs, interZoneLegs,
    travel: travelTotal, hotel: hotelTotal,
    points: counted.reduce((a, b) => a + b, 0), pointsAll: pts.reduce((a, b) => a + b, 0), bestN,
    prizeGross: picks.reduce((a, p) => a + p.prizeGross, 0), prizeNet,
    balance: prizeNet - travelTotal - hotelTotal,
    surfaceWeeks,
  };
  const order = { bad: 0, warn: 1, info: 2 };
  checks.sort((a, b) => order[a.level] - order[b.level] || (a.week ?? 99) - (b.week ?? 99));
  return { picks, trips, state, pickAt, checks, totals, settings };
}

/** Where an entry rank stands against an event's modeled cutoffs. */
export function entryStatus(event, myRank) {
  const en = event.entry;
  if (!en || !myRank) return null;
  if (myRank <= en.cutoffRank * 0.9) return 'direct';
  if (myRank <= en.cutoffRank * 1.1) return 'borderline';
  if (en.qualCutoffRank && myRank <= en.qualCutoffRank) return 'qualifying';
  return 'out';
}

/** Current career position: the viewer's own setting, else what the local build read from Player.log. */
export function careerNow(catalog, settings = {}) {
  if (settings.careerYear && settings.careerWeek) return { year: Number(settings.careerYear), week: Number(settings.careerWeek), source: 'set here' };
  return catalog.career || null;
}

/** Rank that `points` would hold in a descending points snapshot (1-based). */
export function rankFor(points, snapshot) {
  if (!snapshot?.length) return null;
  let lo = 0, hi = snapshot.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (snapshot[mid] > points) lo = mid + 1; else hi = mid; }
  return lo + 1;
}

/** Sum of every event's one-way fare from a home zone (the guide §7 comparison). */
export function zoneCostTable(catalog, tourKey, tiers, year) {
  const events = catalog.tours[tourKey].events.filter(e => tiers.includes(e.tier) && activeInYear(e, year) && e.zone);
  const rows = [];
  for (let z = 1; z <= 8; z++) rows.push({ zone: z, total: events.reduce((a, e) => a + fare(catalog.fares, z, e.zone), 0), n: events.length });
  return rows.sort((a, b) => a.total - b.total);
}
