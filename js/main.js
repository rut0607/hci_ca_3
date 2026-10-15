/* ==========================================================
   Showtime – interactions
   Shared UI (header, toasts, dialogs, saving, walkthrough) and
   one small module per page. Data lives in js/data.js.
   ========================================================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const PAGE = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOLD_MS = 10 * 60 * 1000;
const hash = s => [...String(s)].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 7);

const ICON = {
  heart: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  pin: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>',
  back: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5 M11 6l-6 6 6 6"/></svg>',
  share: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7h16v-7 M12 3v13 M7 8l5-5 5 5"/></svg>',
  cal: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4"/></svg>',
  clock: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2"/></svg>',
  down: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12 M7 10l5 5 5-5 M4 21h16"/></svg>',
  ticket: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z M13 6v12"/></svg>',
  search: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3"/></svg>',
  arrow: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14 M13 6l6 6-6 6"/></svg>',
  check: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
  eye: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>'
};

/* ==========================================================
   Shared UI
   ========================================================== */
function toast(msg, action) {
  let wrap = $('.toasts');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toasts'; wrap.setAttribute('role', 'status'); wrap.setAttribute('aria-live', 'polite');
    document.body.append(wrap);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>${msg}</span>` + (action ? `<a href="${action.href}">${action.label}</a>` : '');
  wrap.append(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 4000);
}

function dialog({ title, body, ok = 'Confirm', cancel = 'Cancel', danger = false }) {
  return new Promise(resolve => {
    const d = document.createElement('dialog');
    d.className = 'modal';
    d.innerHTML = `<h2>${title}</h2><p class="muted">${body}</p><div class="actions">${cancel ? `<button class="btn btn-outline" value="no">${cancel}</button>` : ''}<button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" value="yes">${ok}</button></div>`;
    document.body.append(d);
    d.showModal();
    d.addEventListener('click', e => {
      if (e.target === d && cancel) d.close('no');
      const b = e.target.closest('button[value]');
      if (b) d.close(b.value);
    });
    d.addEventListener('cancel', e => { if (!cancel) e.preventDefault(); });
    d.addEventListener('close', () => { resolve(d.returnValue === 'yes'); d.remove(); });
  });
}

function setLoading(btn, on, label = 'Please wait…') {
  if (on) { btn.dataset.label = btn.innerHTML; btn.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${label}`; btn.disabled = true; }
  else { btn.innerHTML = btn.dataset.label; btn.disabled = false; }
}

/* Field validation helpers – messages appear under the field. */
function fieldError(input, msg) {
  const field = input.closest('.field') || input.parentElement;
  let err = $('.error', field);
  if (msg) {
    if (!err) { err = document.createElement('p'); err.className = 'error'; err.id = input.id + '-err'; field.append(err); }
    err.textContent = msg;
    input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', err.id);
    field.classList.add('invalid');
  } else {
    err?.remove(); input.removeAttribute('aria-invalid'); field.classList.remove('invalid');
  }
  return !msg;
}
function validateAll(rules) {
  let first = null;
  rules.forEach(([input, check]) => { const msg = check(input.value.trim()); fieldError(input, msg); if (msg && !first) first = input; });
  if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' }); }
  return !first;
}
function liveValidate(rules) {
  rules.forEach(([input, check]) => {
    input.addEventListener('blur', () => { if (input.value.trim()) fieldError(input, check(input.value.trim())); });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid')) fieldError(input, check(input.value.trim())); });
  });
}
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const req = label => v => v ? '' : `Enter your ${label}.`;
const emailRule = v => !v ? 'Enter your email address.' : isEmail(v) ? '' : 'Enter an email like name@example.com.';

/* ---------- Header ---------- */
const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
function renderHeader() {
  const user = store.get('user', null);
  const actions = $('.nav-actions');
  if (user && actions) {
    $$('a[href="login.html"], a[href="signup.html"]', actions).forEach(a => a.remove());
    const wrap = document.createElement('div');
    wrap.className = 'user-menu';
    wrap.innerHTML = `<button class="avatar-btn" aria-haspopup="true" aria-expanded="false"><span class="avatar sm">${esc(initials(user.name))}</span><span class="hide-sm">${esc(user.name.split(' ')[0])}</span></button>
      <div class="menu" hidden><div class="menu-head"><b>${esc(user.name)}</b><span>${esc(user.email)}</span></div>
      <a href="bookings.html">My tickets</a><a href="saved.html">Saved events</a><a href="profile.html">Account settings</a><button type="button" data-logout>Log out</button></div>`;
    actions.insertBefore(wrap, $('.menu-toggle', actions));
    const btn = $('.avatar-btn', wrap), menu = $('.menu', wrap);
    const set = open => { menu.hidden = !open; btn.setAttribute('aria-expanded', open); };
    btn.addEventListener('click', e => { e.stopPropagation(); set(menu.hidden); });
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) set(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }
  updateSavedBadge();

  const toggle = $('.menu-toggle'), links = $('.nav-links');
  toggle?.addEventListener('click', () => toggle.setAttribute('aria-expanded', links.classList.toggle('open')));

  const header = $('.site-header');
  const onScroll = () => header?.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
}
document.addEventListener('click', e => {
  if (!e.target.closest('[data-logout]')) return;
  e.preventDefault();
  store.del('user'); flash.set('You’re logged out. See you soon.');
  location.href = 'index.html';
});
function updateSavedBadge() {
  const a = $('.nav-links a[href="saved.html"]'); if (!a) return;
  const n = store.get('saved', []).length;
  let b = $('.count', a);
  if (!b) { b = document.createElement('span'); b.className = 'count'; a.append(b); }
  b.textContent = n; b.hidden = !n;
}

/* ---------- Saving events ---------- */
const isSaved = id => store.get('saved', []).includes(id);
function toggleSave(id) {
  let saved = store.get('saved', []);
  const on = !saved.includes(id);
  saved = on ? [...saved, id] : saved.filter(x => x !== id);
  store.set('saved', saved);
  updateSavedBadge();
  $$(`[data-save="${id}"]`).forEach(b => {
    b.setAttribute('aria-pressed', on);
    b.classList.remove('pop'); void b.offsetWidth; if (on) b.classList.add('pop');
    const label = $('[data-save-label]', b); if (label) label.textContent = on ? 'Saved' : 'Save for later';
  });
  toast(on ? 'Saved. We’ll let you know if the price drops.' : 'Removed from saved events.', on && PAGE !== 'saved' ? { href: 'saved.html', label: 'View saved' } : null);
  document.dispatchEvent(new CustomEvent('savedchange', { detail: { id, on } }));
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-save]');
  if (!b) return;
  e.preventDefault(); toggleSave(b.dataset.save);
});

/* ---------- Event card ---------- */
function cardHTML(e) {
  const d = toDate(e.date);
  const drop = e.was && e.was > e.price;
  const flags = [drop ? `<span class="flag flag-drop">Price dropped ${fmt(e.was - e.price)}</span>` : '', e.left <= 50 ? `<span class="flag flag-low">Only ${e.left} left</span>` : ''].join('');
  return `<article class="card reveal" data-id="${e.id}">
    <button class="heart" data-save="${e.id}" aria-label="Save ${esc(e.title)}" aria-pressed="${isSaved(e.id)}">${ICON.heart}</button>
    <a href="event.html?id=${e.id}" class="art ${e.art}" tabindex="-1" aria-hidden="true"><span class="tag">${e.cat}</span><span class="datebox"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></span></a>
    <div class="card-body">
      <h3 class="card-title"><a href="event.html?id=${e.id}">${esc(e.title)}</a></h3>
      <span class="card-meta">${ICON.pin} ${esc(e.venue)}, ${esc(e.city)}</span>
      ${flags ? `<div class="flags">${flags}</div>` : ''}
      <div class="card-foot"><span class="price"><small>From </small>${drop ? `<s>${fmt(e.was)}</s> ` : ''}${fmt(e.price)}</span><a href="event.html?id=${e.id}" class="btn btn-outline btn-sm">View</a></div>
    </div></article>`;
}

/* ---------- Scroll reveal ---------- */
const revealIO = 'IntersectionObserver' in window && !REDUCED
  ? new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); } }), { rootMargin: '0px 0px -40px 0px' })
  : null;
function observeReveal(root = document) {
  $$('.reveal:not(.in)', root).forEach((el, i) => {
    if (!revealIO) { el.classList.add('in'); return; }
    el.style.transitionDelay = Math.min(i % 6, 5) * 50 + 'ms';
    revealIO.observe(el);
  });
}

/* ---------- Ticket hold timer (shared by tickets, checkout, payment failed) ---------- */
function runHold(order, onExpire) {
  const tick = () => {
    const s = Math.max(0, Math.ceil((order.holdUntil - Date.now()) / 1000));
    const txt = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    $$('[data-hold]').forEach(el => el.textContent = txt);
    $$('.timer').forEach(t => t.classList.toggle('warn', s <= 120));
    if (s <= 0) { clearInterval(iv); onExpire(); }
  };
  const iv = setInterval(tick, 1000); tick();
}
async function holdExpired(order) {
  await dialog({ title: 'Your hold has ended', body: 'We released your tickets after 10 minutes so others could book them. Your choices are saved, so picking again only takes a moment.', ok: 'Choose tickets again', cancel: null });
  order.holdUntil = null; store.set('order', order);
  location.href = `tickets.html?id=${order.eventId}`;
}

/* ---------- Calendar file ---------- */
function downloadICS(e) {
  const start = new Date(`${e.date}T${e.time || '19:00'}:00`);
  const end = new Date(start.getTime() + 3 * 3600e3);
  const stamp = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Showtime//Prototype//EN', 'BEGIN:VEVENT',
    `UID:${e.id || hash(e.title)}@showtime.demo`, `DTSTAMP:${stamp(TODAY)}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${e.title}`, `LOCATION:${e.venue}, ${e.city}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.ics';
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Calendar file downloaded. Open it to add the event.');
}

/* ---------- Mock QR code (deterministic per booking) ---------- */
function qrSVG(seed) {
  const n = 25; let h = hash(seed) || 1;
  const rnd = () => (h = (Math.imul(h, 1103515245) + 12345) >>> 0) / 4294967296;
  const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  let cells = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const inFinder = (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
    if (!inFinder && rnd() > .52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg class="qr" viewBox="-1 -1 ${n + 2} ${n + 2}" role="img" aria-label="QR code for booking ${seed}" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><g fill="#17211f">${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}${cells}</g></svg>`;
}

/* ---------- Confetti (once, on a fresh booking) ---------- */
function confetti() {
  if (REDUCED) return;
  const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
  const colors = ['#0f5c5c', '#c98a2b', '#e3eeec', '#17211f', '#ead6b8'];
  for (let i = 0; i < 36; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = Math.random() * .4 + 's';
    p.style.setProperty('--x', (Math.random() * 160 - 80) + 'px');
    p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    box.append(p);
  }
  document.body.append(box); setTimeout(() => box.remove(), 3200);
}

/* ---------- Password show/hide ---------- */
function passwordToggles() {
  $$('input[type=password]').forEach(input => {
    const wrap = document.createElement('span'); wrap.className = 'pw-wrap';
    input.before(wrap); wrap.append(input);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pw-toggle'; b.textContent = 'Show'; b.setAttribute('aria-label', 'Show password');
    b.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password'; b.textContent = show ? 'Hide' : 'Show';
      b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
    wrap.append(b);
  });
}

/* ==========================================================
   Guided walkthrough – follows a user flow across pages
   ========================================================== */
const flowHref = page => ({ event: 'event.html?id=northern-lights', tickets: 'tickets.html?id=northern-lights' }[page] || page + '.html');
function startTour(id) {
  const f = FLOWS.find(x => x.id === id);
  store.set('tour', { id, i: 0 });
  if (id === 'recovery') seedDemoOrder();
  location.href = flowHref(f.steps[0].page);
}
function renderTour() {
  const t = store.get('tour', null); if (!t) return;
  const f = FLOWS.find(x => x.id === t.id); if (!f) return;
  const steps = f.steps; let i = Math.min(t.i, steps.length - 1);
  if (steps[i].page !== PAGE) {
    let j = steps.findIndex((s, k) => k > i && s.page === PAGE);
    if (j < 0) j = steps.findIndex(s => s.page === PAGE);
    if (j >= 0) i = j;
  }
  store.set('tour', { id: f.id, i });
  const s = steps[i], next = steps[i + 1], onPath = s.page === PAGE;
  const bar = document.createElement('aside');
  bar.className = 'tour'; bar.setAttribute('aria-label', 'Guided walkthrough');
  bar.innerHTML = `<div class="tour-head"><span>Walkthrough · ${esc(f.name)}</span><button type="button" class="tour-x" aria-label="End walkthrough" data-tour-exit>×</button></div>
    <div class="tour-dots" aria-hidden="true">${steps.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('')}</div>
    <p>${onPath ? `<b>Step ${i + 1} of ${steps.length} · ${esc(s.label)}</b><span>${esc(s.note)}</span>` : `<b>You’ve left the path</b><span>Head back to <a class="link" href="${flowHref(s.page)}">${esc(s.label)}</a> to continue.</span>`}</p>
    <div class="tour-actions">${next ? `<a class="btn btn-primary btn-sm" data-tour-next href="${flowHref(next.page)}">Next: ${esc(next.label)} ${ICON.arrow}</a>` : `<button class="btn btn-primary btn-sm" type="button" data-tour-exit>Finish walkthrough</button>`}<a class="small muted" href="flow.html">All flows</a></div>`;
  document.body.append(bar);
  document.body.classList.add('has-tour');
  $('[data-tour-next]', bar)?.addEventListener('click', e => {
    store.set('tour', { id: f.id, i: i + 1 });
    if (next.page === PAGE) { e.preventDefault(); bar.remove(); renderTour(); document.dispatchEvent(new CustomEvent('tourstep', { detail: next })); }
  });
  $$('[data-tour-exit]', bar).forEach(b => b.addEventListener('click', () => {
    store.del('tour'); bar.remove(); document.body.classList.remove('has-tour');
    if (!next) toast('Walkthrough complete. Nice work.', { href: 'flow.html', label: 'Try another' });
  }));
}
function seedDemoOrder() {
  const e = EVENTS[0];
  store.set('order', { eventId: e.id, items: [{ key: 'ga', name: 'General admission', qty: 2, price: e.price }], seats: [], holdUntil: Date.now() + HOLD_MS });
}

/* ==========================================================
   Pages
   ========================================================== */
const pages = {};

/* ---------- Home ---------- */
pages.index = () => {
  const upcoming = allEvents().filter(e => toDate(e.date) >= toDate('2026-10-16')).sort((a, b) => a.date.localeCompare(b.date));
  $('#list-soon').innerHTML = upcoming.slice(0, 6).map(cardHTML).join('');
  $('#list-trending').innerHTML = [...upcoming].sort((a, b) => b.pop - a.pop).slice(0, 3).map(cardHTML).join('');
  $$('[data-cat-count]').forEach(el => { const n = allEvents().filter(e => e.cat === el.dataset.catCount).length; el.textContent = `${n} event${n === 1 ? '' : 's'}`; });

  const user = store.get('user', null);
  if (user) $('#greet').textContent = `Welcome back, ${user.name.split(' ')[0]} · ${user.city || 'Mumbai'}`;
  if (user?.city) $('#city').value = user.city;

  // Ticker of what’s on next
  const items = upcoming.slice(0, 8).map(e => { const d = toDate(e.date); return `<a href="event.html?id=${e.id}"><b>${d.getDate()} ${MONTHS[d.getMonth()]}</b> ${esc(e.title)} <span>${esc(e.city)}</span></a>`; }).join('');
  $('#ticker').innerHTML = `<div class="ticker-track">${items}${items.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ')}</div>`;

  // Tilt the featured ticket toward the pointer
  const stub = $('.hero .stub');
  if (stub && !REDUCED && matchMedia('(hover: hover)').matches) {
    stub.addEventListener('pointermove', e => {
      const r = stub.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      stub.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) rotate(1deg)`;
    });
    stub.addEventListener('pointerleave', () => stub.style.transform = '');
  }

  // Count-up stats
  const stats = $$('[data-count]');
  const run = el => {
    const target = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, suf = el.dataset.suffix || '';
    if (REDUCED) { el.textContent = target.toFixed(dec) + suf; return; }
    const t0 = performance.now();
    const step = t => { const p = Math.min(1, (t - t0) / 1100), v = target * (1 - Math.pow(1 - p, 3)); el.textContent = v.toFixed(dec) + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } }), { threshold: .6 });
    stats.forEach(s => io.observe(s));
  } else stats.forEach(run);
};

/* ---------- Events: search, filter, sort ---------- */
pages.events = () => {
  const PER = 6;
  const f = {
    q: qs.get('q') || '', cats: (qs.get('cat') || '').split(',').filter(Boolean), city: qs.get('city') || '',
    when: qs.get('when') || '', date: qs.get('date') || '', max: +qs.get('max') || 5000, sort: qs.get('sort') || 'date'
  };
  let shown = PER;
  const el = { q: $('#f-q'), city: $('#fcity'), date: $('#fdate'), price: $('#price'), priceOut: $('#price-out'), sort: $('#sort'), results: $('#results'), pills: $('#pills'), count: $('#count'), more: $('#load-more'), shownTxt: $('#shown'), empty: $('#empty') };

  $('#cat-boxes').innerHTML = CATEGORIES.map(c => `<div class="check"><input type="checkbox" id="c-${c}" name="cat" value="${c}"><label for="c-${c}">${c}<span class="muted"> · ${allEvents().filter(e => e.cat === c).length}</span></label></div>`).join('');
  el.city.innerHTML = '<option value="">Any city</option>' + CITIES.map(c => `<option>${c}</option>`).join('');

  const nextWeekend = () => {
    const d = new Date(TODAY); d.setHours(0, 0, 0, 0);
    const sat = new Date(d); sat.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
    if (d.getDay() === 0) sat.setDate(d.getDate() - 1);
    const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
    return [sat, sun];
  };
  const priceLabel = v => v >= 5000 ? 'Any price' : 'Up to ' + fmt(v);

  function syncInputs() {
    el.q.value = f.q; el.city.value = f.city; el.date.value = f.date; el.price.value = f.max; el.sort.value = f.sort;
    el.priceOut.textContent = priceLabel(f.max);
    $$('[name=cat]').forEach(c => c.checked = f.cats.includes(c.value));
    $$('[data-when]').forEach(c => { const on = c.dataset.when === f.when; c.classList.toggle('active', on); c.setAttribute('aria-pressed', on); });
  }

  function results() {
    const q = f.q.toLowerCase(), [sat, sun] = nextWeekend();
    const in30 = new Date(TODAY); in30.setDate(in30.getDate() + 30);
    const list = allEvents().filter(e => {
      const d = toDate(e.date);
      if (d < toDate('2026-10-16')) return false;
      if (q && !`${e.title} ${e.venue} ${e.city} ${e.cat}`.toLowerCase().includes(q)) return false;
      if (f.cats.length && !f.cats.includes(e.cat)) return false;
      if (f.city && e.city !== f.city) return false;
      if (f.when === 'weekend' && !(d >= sat && d <= sun)) return false;
      if (f.when === 'month' && d > in30) return false;
      if (f.date && e.date < f.date) return false;
      if (f.max < 5000 && e.price > f.max) return false;
      return true;
    });
    const by = { date: (a, b) => a.date.localeCompare(b.date), low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, popular: (a, b) => b.pop - a.pop };
    return list.sort(by[f.sort] || by.date);
  }

  function pills() {
    const p = [];
    if (f.q) p.push(['q', `“${esc(f.q)}”`]);
    f.cats.forEach(c => p.push(['cat:' + c, c]));
    if (f.city) p.push(['city', f.city]);
    if (f.when) p.push(['when', f.when === 'weekend' ? 'This weekend' : 'Next 30 days']);
    if (f.date) p.push(['date', 'From ' + fmtDate(f.date).replace(/ \d{4}$/, '')]);
    if (f.max < 5000) p.push(['max', 'Under ' + fmt(f.max)]);
    el.pills.innerHTML = p.map(([k, l]) => `<span class="pill">${l}<button type="button" data-remove="${k}" aria-label="Remove filter ${l.replace(/<[^>]+>/g, '')}">×</button></span>`).join('');
    const n = p.filter(([k]) => k !== 'q').length;
    $('#filter-count').textContent = n ? ` (${n})` : '';
    return p.length;
  }

  function render(resetPage = true) {
    if (resetPage) shown = PER;
    const list = results(), n = list.length;
    el.results.innerHTML = list.slice(0, shown).map(cardHTML).join('');
    observeReveal(el.results);
    el.count.textContent = `${n} event${n === 1 ? '' : 's'}${f.city ? ' in ' + f.city : ''}`;
    el.empty.hidden = n > 0;
    el.more.hidden = shown >= n;
    el.shownTxt.textContent = n ? `Showing ${Math.min(shown, n)} of ${n}` : '';
    pills();
    const params = new URLSearchParams();
    if (f.q) params.set('q', f.q); if (f.cats.length) params.set('cat', f.cats.join(',')); if (f.city) params.set('city', f.city);
    if (f.when) params.set('when', f.when); if (f.date) params.set('date', f.date); if (f.max < 5000) params.set('max', f.max); if (f.sort !== 'date') params.set('sort', f.sort);
    history.replaceState(null, '', 'events.html' + (params.toString() ? '?' + params : ''));
  }

  let timer;
  el.q.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { f.q = el.q.value.trim(); render(); }, 160); });
  $('#cat-boxes').addEventListener('change', () => { f.cats = $$('[name=cat]:checked').map(c => c.value); render(); });
  el.city.addEventListener('change', () => { f.city = el.city.value; render(); });
  el.date.addEventListener('change', () => { f.date = el.date.value; render(); });
  el.price.addEventListener('input', () => { f.max = +el.price.value; el.priceOut.textContent = priceLabel(f.max); render(); });
  el.sort.addEventListener('change', () => { f.sort = el.sort.value; render(); });
  $$('[data-when]').forEach(c => c.addEventListener('click', () => { f.when = f.when === c.dataset.when ? '' : c.dataset.when; syncInputs(); render(); }));
  el.more.addEventListener('click', () => { shown += PER; render(false); el.results.children[shown - PER]?.querySelector('a:not([tabindex])')?.focus(); });
  const clear = () => { Object.assign(f, { q: '', cats: [], city: '', when: '', date: '', max: 5000 }); syncInputs(); render(); toast('Filters cleared.'); };
  $$('[data-clear]').forEach(b => b.addEventListener('click', clear));
  el.pills.addEventListener('click', e => {
    const b = e.target.closest('[data-remove]'); if (!b) return;
    const k = b.dataset.remove;
    if (k.startsWith('cat:')) f.cats = f.cats.filter(c => c !== k.slice(4));
    else if (k === 'max') f.max = 5000; else f[k] = '';
    syncInputs(); render();
  });
  $('#filter-toggle').addEventListener('click', e => {
    const open = $('.filters').classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', open);
  });
  $('#filters-done')?.addEventListener('click', () => { $('.filters').classList.remove('open'); $('#filter-toggle').setAttribute('aria-expanded', false); el.results.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); });

  syncInputs(); render();
  if (qs.get('focus')) el.q.focus();
};

/* ---------- Event details ---------- */
pages.event = () => {
  const e = getEvent(qs.get('id') || 'northern-lights');
  const main = $('#main');
  if (!e) {
    document.title = 'Event not found · Showtime';
    main.innerHTML = `<div class="container notfound"><div class="big">?</div><h1>We couldn’t find that <em>event</em>.</h1><p class="muted">It may have ended or been removed by the organizer.</p><div class="actions"><a href="events.html" class="btn btn-primary">Browse events</a></div></div>`;
    return;
  }
  document.title = `${e.title} · Showtime`;
  const drop = e.was && e.was > e.price;
  const related = allEvents().filter(x => x.id !== e.id && (x.cat === e.cat || x.city === e.city) && x.date >= '2026-10-16').sort((a, b) => (b.cat === e.cat) - (a.cat === e.cat) || b.pop - a.pop).slice(0, 2);
  const left = e.left <= 50 ? `<p class="small urgent">${ICON.clock} Selling fast · only ${e.left} left</p>` : `<p class="small muted">${e.left.toLocaleString('en-IN')} tickets available</p>`;
  main.innerHTML = `
  <section class="art ${e.art} event-hero">
    <div class="container">
      <a class="back" href="events.html">${ICON.back} Back to events</a>
      <div><span class="tag">${e.cat}</span><h1>${esc(e.title)}</h1><p>${esc(e.blurb || '')}</p></div>
    </div>
  </section>
  <div class="container">
    <div class="facts reveal">
      <div><span>Date</span><b>${fmtDate(e.date)}</b></div><div><span>Starts</span><b>${fmtTime(e.time)}${e.doors ? ` <small class="muted">· doors ${fmtTime(e.doors)}</small>` : ''}</b></div><div><span>Venue</span><b>${esc(e.venue)}</b></div><div><span>Age</span><b>${e.age || 'All ages'}</b></div>
    </div>
    <div class="layout-main">
      <div>
        <div class="panel reveal"><h2>About this event</h2>
          <p class="muted">${esc(e.about || e.blurb || '')}</p>
          ${e.lineup?.length ? `<h3 style="margin-top:28px">Running order</h3><ul class="timeline">${e.lineup.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul>` : ''}
        </div>
        <div class="panel reveal"><h2>Venue &amp; entry</h2>
          <ul class="info-list">${e.area ? `<li><span>Address</span><span>${esc(e.area)}, ${esc(e.city)}</span></li>` : `<li><span>City</span><span>${esc(e.city)}</span></li>`}${e.station ? `<li><span>Nearest station</span><span>${esc(e.station)}</span></li>` : ''}<li><span>Entry</span><span>Show your e-ticket QR code</span></li><li><span>Refunds</span><span>Free up to 48 hours before</span></li></ul></div>
        ${related.length ? `<div class="panel reveal"><h2>You might also like</h2><div class="grid grid-2" style="margin-top:12px">${related.map(cardHTML).join('')}</div></div>` : ''}
      </div>
      <aside class="sticky">
        <div class="panel buy">
          <p class="muted small" style="margin-bottom:2px">Tickets from</p>
          <p class="big-price">${drop ? `<s>${fmt(e.was)}</s> ` : ''}${fmt(e.price)}</p>
          ${drop ? `<p class="small drop-note">Price dropped by ${fmt(e.was - e.price)}${isSaved(e.id) ? ' since you saved it' : ' this week'}</p>` : ''}
          ${left}
          <a href="tickets.html?id=${e.id}" class="btn btn-primary btn-block">Select tickets</a>
          <button class="btn btn-outline btn-block save-btn" data-save="${e.id}" aria-pressed="${isSaved(e.id)}" style="margin-top:10px">${ICON.heart} <span data-save-label>${isSaved(e.id) ? 'Saved' : 'Save for later'}</span></button>
          <div class="share" style="margin-top:14px"><button class="btn btn-outline btn-sm" id="share" style="flex:1">${ICON.share} Share</button><button class="btn btn-outline btn-sm" id="ics" style="flex:1">${ICON.cal} Calendar</button></div>
          <p class="hint" style="margin-top:14px">Free cancellation up to 48 hours before the event. The total, including fees, is shown before you pay.</p>
        </div>
      </aside>
    </div>
  </div>
  <div class="mobile-cta"><div><small class="muted">From</small> <b>${fmt(e.price)}</b></div><a href="tickets.html?id=${e.id}" class="btn btn-primary">Select tickets</a></div>`;
  document.body.classList.add('has-cta');
  $('#ics').addEventListener('click', () => downloadICS(e));
  $('#share').addEventListener('click', async () => {
    const url = location.href;
    if (navigator.share) { try { await navigator.share({ title: e.title, url }); } catch {} return; }
    try { await navigator.clipboard.writeText(url); toast('Link copied. Paste it anywhere to share.'); } catch { toast('Copy this link: ' + esc(url)); }
  });
};

/* ---------- Tickets & seats ---------- */
pages.tickets = () => {
  let order = store.get('order', null);
  const e = getEvent(qs.get('id') || order?.eventId || 'northern-lights') || EVENTS[0];
  if (!order || order.eventId !== e.id) order = { eventId: e.id, items: [], seats: [] };
  if (!order.holdUntil || order.holdUntil < Date.now()) order.holdUntil = Date.now() + HOLD_MS;
  store.set('order', order);

  const MAX = 8, tiers = tiersFor(e);
  const qty = Object.fromEntries(tiers.map(t => [t.key, order.items.find(i => i.key === t.key)?.qty || 0]));
  let seats = order.seats || [];

  $('#t-sub').textContent = `${e.title} · ${fmtDate(e.date)} · ${fmtTime(e.time)}`;
  $('.back').href = `event.html?id=${e.id}`;
  $('#tiers').innerHTML = tiers.map(t => `<div class="tier" data-key="${t.key}"><div><h3>${t.name}${t.low ? ' <span class="badge-low">Few left</span>' : ''}</h3><span class="muted small">${t.note} · ${fmt(t.price)}</span></div>
    <div class="qty"><button type="button" data-dir="-1" aria-label="Remove one ${t.name} ticket">−</button><span aria-live="polite">0</span><button type="button" data-dir="1" aria-label="Add one ${t.name} ticket">+</button></div></div>`).join('');

  const rows = 'ABCDE';
  $('#seat-map').innerHTML = [...rows].map(r => `<span class="row-label" aria-hidden="true">${r}</span>` + Array.from({ length: 10 }, (_, i) => {
    const id = r + (i + 1), taken = hash(e.id + id) % 5 === 0;
    return `<button type="button" class="seat${taken ? ' taken' : ''}" data-seat="${id}" aria-label="Row ${r}, seat ${i + 1}${taken ? ', taken' : ''}" aria-pressed="false"${taken ? ' disabled' : ''}></button>`;
  }).join('')).join('');
  seats = seats.filter(s => !$(`.seat[data-seat="${s}"]`)?.disabled);

  const btn = $('#continue-btn');
  function update() {
    const count = Object.values(qty).reduce((a, b) => a + b, 0), need = qty.premium;
    if (seats.length > need) seats = seats.slice(0, need);
    tiers.forEach(t => {
      const row = $(`.tier[data-key="${t.key}"]`);
      $('span[aria-live]', row).textContent = qty[t.key];
      $('[data-dir="-1"]', row).disabled = !qty[t.key];
      $('[data-dir="1"]', row).disabled = count >= MAX;
      row.classList.toggle('active', qty[t.key] > 0);
    });
    $('#max-hint').classList.toggle('at-max', count >= MAX);
    $('#max-hint').textContent = count >= MAX ? 'You’ve reached the limit of 8 tickets per booking.' : 'Maximum 8 tickets per booking.';
    $$('.seat[data-seat]').forEach(s => { const on = seats.includes(s.dataset.seat); s.classList.toggle('selected', on); s.setAttribute('aria-pressed', on); });
    $('#seat-panel').classList.toggle('locked', !need);
    $('#seat-msg').innerHTML = !need ? 'Add a <b>Premium seated</b> ticket to choose your seats.'
      : seats.length < need ? `Pick <b>${need - seats.length}</b> more seat${need - seats.length > 1 ? 's' : ''} on the map.`
      : `${ICON.check} Seats ${seats.sort().join(', ')} selected.`;

    order.items = tiers.filter(t => qty[t.key]).map(t => ({ key: t.key, name: t.name, qty: qty[t.key], price: t.price }));
    order.seats = seats; store.set('order', order);
    const tt = orderTotals(order);
    $('#sum-lines').innerHTML = order.items.length
      ? order.items.map(i => `<div class="summary-row"><span class="muted">${i.qty} × ${i.name}</span><span>${fmt(i.qty * i.price)}</span></div>`).join('') + (seats.length ? `<div class="summary-row"><span class="muted">Seats</span><span>${seats.join(', ')}</span></div>` : '')
      : '<p class="muted small" style="margin:0 0 6px">No tickets selected yet.</p>';
    $('#sum-fee').textContent = fmt(tt.fee);
    $('#sum-total').textContent = fmt(tt.total);
    const block = !tt.count ? 'Select at least one ticket to continue.' : seats.length < need ? `Choose ${need - seats.length} more seat${need - seats.length > 1 ? 's' : ''} to continue.` : '';
    btn.classList.toggle('is-disabled', !!block); btn.setAttribute('aria-disabled', !!block);
    btn.textContent = tt.count ? `Continue · ${fmt(tt.total)}` : 'Continue to payment';
    $('#continue-hint').textContent = block || 'This is the final price. No hidden charges.';
    $('#continue-hint').classList.toggle('blocked', !!block);
  }

  $('#tiers').addEventListener('click', ev => {
    const b = ev.target.closest('[data-dir]'); if (!b || b.disabled) return;
    const key = b.closest('.tier').dataset.key;
    qty[key] = Math.max(0, qty[key] + +b.dataset.dir);
    update();
    if (key === 'premium' && +b.dataset.dir > 0 && qty.premium === 1) $('#seat-panel').scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' });
  });
  $('#seat-map').addEventListener('click', ev => {
    const s = ev.target.closest('.seat'); if (!s || s.disabled) return;
    const id = s.dataset.seat;
    if (!qty.premium) { toast('Add a Premium seated ticket first, then pick your seats.'); return; }
    if (seats.includes(id)) seats = seats.filter(x => x !== id);
    else if (seats.length < qty.premium) seats.push(id);
    else { toast(`You’ve picked all ${qty.premium} seat${qty.premium > 1 ? 's' : ''}. Tap a selected seat to swap it.`); return; }
    update();
  });
  btn.addEventListener('click', ev => {
    if (btn.getAttribute('aria-disabled') !== 'true') return;
    ev.preventDefault();
    const hint = $('#continue-hint'); hint.classList.remove('shake'); void hint.offsetWidth; hint.classList.add('shake');
    if (Object.values(qty).some(Boolean)) $('#seat-panel').scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
  });

  update();
  runHold(order, () => holdExpired(order));
};

/* ---------- Checkout ---------- */
function ensureOrder() {
  let order = store.get('order', null);
  if (!order || !order.items?.length) { seedDemoOrder(); order = store.get('order'); }
  if (!order.holdUntil) { order.holdUntil = Date.now() + HOLD_MS; store.set('order', order); }
  return order;
}
function orderSummaryHTML(order) {
  const e = getEvent(order.eventId) || EVENTS[0], tt = orderTotals(order);
  return `<div class="mini"><div class="art ${e.art}"></div><div><b>${esc(e.title)}</b><span class="muted small">${fmtDate(e.date)} · ${fmtTime(e.time)}<br>${esc(e.venue)}, ${esc(e.city)}</span></div></div>
    <div class="timer">${ICON.clock}<span>Tickets held for <b data-hold>10:00</b></span></div>
    ${order.items.map(i => `<div class="summary-row"><span class="muted">${i.qty} × ${i.name}</span><span>${fmt(i.qty * i.price)}</span></div>`).join('')}
    ${order.seats?.length ? `<div class="summary-row"><span class="muted">Seats</span><span>${order.seats.join(', ')}</span></div>` : ''}
    <div class="summary-row"><span class="muted">Service fee (5%)</span><span>${fmt(tt.fee)}</span></div>
    <div class="summary-total"><span>Total</span><span>${fmt(tt.total)}</span></div>`;
}

pages.checkout = () => {
  const order = ensureOrder();
  const tt = orderTotals(order), user = store.get('user', null);
  $('.back').href = `tickets.html?id=${order.eventId}`;
  $('#co-summary').innerHTML = orderSummaryHTML(order);
  $('#pay-btn').textContent = `Pay ${fmt(tt.total)}`;
  if (order.holdUntil < Date.now()) { holdExpired(order); return; }
  runHold(order, () => holdExpired(order));

  const fn = $('#fn'), ln = $('#ln'), em = $('#em'), ph = $('#ph');
  const c = order.contact || {};
  if (user) {
    const [first, ...rest] = user.name.split(' ');
    fn.value = c.fn || first; ln.value = c.ln || rest.join(' '); em.value = c.em || user.email; ph.value = c.ph || user.phone || '';
    $('.guest-box').innerHTML = `<span>${ICON.check} Logged in as <b>${esc(user.name)}</b>. We’ve filled in your details.</span><button type="button" class="btn btn-outline btn-sm" data-logout style="background:#fff">Not you?</button>`;
  } else {
    fn.value = c.fn || ''; ln.value = c.ln || ''; em.value = c.em || ''; ph.value = c.ph || '';
  }
  [fn, ln, em, ph].forEach(i => i.addEventListener('input', () => { order.contact = { fn: fn.value, ln: ln.value, em: em.value, ph: ph.value }; store.set('order', order); }));

  // Payment method
  const showMethod = m => {
    $$('[data-method]').forEach(p => p.hidden = p.dataset.method !== m);
    $$('input[name=pay]').forEach(r => r.checked = r.value === m);
  };
  $$('input[name=pay]').forEach(r => r.addEventListener('change', () => showMethod(r.value)));
  const startMethod = qs.get('method') || order.method || 'card';
  showMethod(startMethod);
  if (qs.get('method')) toast('Switched payment method. Your tickets are still held.');

  // Card formatting
  const cn = $('#cn'), ex = $('#ex'), cv = $('#cv'), brand = $('#card-brand');
  cn.addEventListener('input', () => {
    const d = cn.value.replace(/\D/g, '').slice(0, 16);
    cn.value = d.replace(/(.{4})/g, '$1 ').trim();
    brand.textContent = /^4/.test(d) ? 'VISA' : /^5[1-5]/.test(d) ? 'MASTERCARD' : /^6/.test(d) ? 'RUPAY' : /^3[47]/.test(d) ? 'AMEX' : '';
  });
  ex.addEventListener('input', ev => {
    let d = ex.value.replace(/\D/g, '').slice(0, 4);
    if (d.length >= 3 || (d.length === 2 && ev.inputType !== 'deleteContentBackward')) d = d.slice(0, 2) + ' / ' + d.slice(2);
    ex.value = d;
  });
  cv.addEventListener('input', () => cv.value = cv.value.replace(/\D/g, '').slice(0, 4));

  const method = () => $('input[name=pay]:checked').value;
  const rules = () => {
    const r = [[fn, req('first name')], [ln, req('last name')], [em, emailRule]];
    if (method() === 'card') r.push(
      [cn, v => v.replace(/\D/g, '').length === 16 ? '' : 'Enter the 16-digit card number.'],
      [ex, v => {
        const m = v.match(/^(\d{2}) \/ (\d{2})$/); if (!m) return 'Enter expiry as MM / YY.';
        if (+m[1] < 1 || +m[1] > 12) return 'Month must be between 01 and 12.';
        return new Date(2000 + +m[2], +m[1]) <= TODAY ? 'This card has expired.' : '';
      }],
      [cv, v => /^\d{3,4}$/.test(v) ? '' : 'Enter the 3 or 4 digits on the back.']);
    if (method() === 'upi') r.push([$('#upi'), v => /^[\w.\-]{2,}@[a-z]{2,}$/i.test(v) ? '' : 'Enter a UPI ID like name@bank.']);
    if (method() === 'net') r.push([$('#bank'), v => v ? '' : 'Choose your bank.']);
    return r;
  };
  liveValidate([[fn, req('first name')], [ln, req('last name')], [em, emailRule]]);

  $('#checkout-form').addEventListener('submit', ev => {
    ev.preventDefault();
    if (!validateAll(rules())) return;
    const terms = $('#terms');
    if (!terms.checked) { $('#terms-row').classList.add('invalid'); terms.focus(); toast('Please accept the terms to continue.'); return; }
    const btn = $('#pay-btn');
    setLoading(btn, true, 'Processing payment…');
    order.method = method(); store.set('order', order);
    setTimeout(() => {
      if (method() === 'card' && cn.value.replace(/\D/g, '') === '4000000000000002') {
        order.error = 'declined'; store.set('order', order);
        location.href = 'payment-failed.html'; return;
      }
      const e = getEvent(order.eventId) || EVENTS[0];
      const id = 'SHT-' + (100000 + Math.floor(Math.random() * 900000));
      const bookings = store.get('bookings', []);
      bookings.unshift({ id, eventId: e.id, title: e.title, art: e.art, cat: e.cat, date: e.date, time: e.time, venue: e.venue, city: e.city, items: order.items, seats: order.seats || [], total: orderTotals(order).total, status: 'confirmed', email: em.value.trim() });
      store.set('bookings', bookings);
      store.del('order');
      location.href = `confirmation.html?b=${id}&new=1`;
    }, 1400);
  });
  $('#terms').addEventListener('change', () => $('#terms-row').classList.remove('invalid'));
  $('#login-link')?.addEventListener('click', ev => { ev.currentTarget.href = 'login.html?next=checkout.html'; });
};

/* ---------- Payment failed ---------- */
pages['payment-failed'] = () => {
  const order = ensureOrder();
  $('#pf-summary').innerHTML = orderSummaryHTML(order);
  $('#change-tickets').href = `tickets.html?id=${order.eventId}`;
  if (order.holdUntil < Date.now()) { holdExpired(order); return; }
  runHold(order, () => holdExpired(order));
};

/* ---------- Confirmation / ticket view ---------- */
pages.confirmation = () => {
  const bookings = store.get('bookings', []);
  const b = bookings.find(x => x.id === qs.get('b')) || bookings.find(x => x.status === 'confirmed') || bookings[0];
  const fresh = qs.get('new') === '1';
  const deadline = new Date(toDate(b.date).getTime() - 2 * 864e5);
  const canCancel = b.status === 'confirmed' && deadline > TODAY;
  const tickets = b.items.map(i => `${i.qty} × ${i.name}`).join('<br>');
  $('#stepper').hidden = !fresh;
  $('#back-link').hidden = fresh;
  $('#c-head').innerHTML = fresh
    ? `<div class="tick pop-in">${ICON.check}</div><h1>You’re <em>going</em>.</h1><p class="muted">A copy of your e-ticket is on its way${b.email ? ' to <b>' + esc(b.email) + '</b>' : ' to your email'}. Show the QR code at the entrance.</p>`
    : `<h1>Your <em>ticket</em></h1><p class="muted">Show this QR code at the entrance. It works offline too.</p>`;
  $('#c-ticket').innerHTML = `<div class="main">
      <span class="eyebrow">${b.cat}${b.status === 'cancelled' ? ' · <span style="color:var(--danger)">Cancelled</span>' : ''}</span>
      <h2 style="margin-bottom:14px">${esc(b.title)}</h2>
      <ul class="info-list"><li><span>Date</span><span>${fmtDate(b.date)}</span></li><li><span>Time</span><span>${fmtTime(b.time)}</span></li><li><span>Venue</span><span>${esc(b.venue)}, ${esc(b.city)}</span></li><li><span>Tickets</span><span style="text-align:right">${tickets}</span></li>${b.seats?.length ? `<li><span>Seats</span><span>${b.seats.join(', ')}</span></li>` : ''}<li><span>Paid</span><span>${fmt(b.total)}</span></li><li><span>Booking ID</span><span class="mono">${b.id}</span></li></ul>
    </div><div class="qr-side">${qrSVG(b.id)}<span>Scan at entry</span></div>`;
  $('#c-ticket').classList.toggle('void', b.status === 'cancelled');
  $('#c-next').innerHTML = `<li>Your ticket is saved in <a class="link" href="bookings.html">My tickets</a> and works offline.</li><li>We’ll remind you the day before the event.</li><li>${canCancel ? `Need to cancel? It’s free until ${fmtDate(deadline.toISOString().slice(0, 10)).replace(/ \d{4}$/, '')}.` : 'This booking can no longer be cancelled online.'}</li>`;
  $('#dl').addEventListener('click', () => window.print());
  $('#ics').addEventListener('click', () => downloadICS(b));
  if (fresh) { confetti(); setTimeout(() => toast('Booking confirmed. Booking ID ' + b.id), 600); }
};

/* ---------- My tickets ---------- */
pages.bookings = () => {
  let tab = qs.get('tab') || 'upcoming';
  const groups = () => {
    const all = store.get('bookings', []);
    return {
      upcoming: all.filter(b => b.status === 'confirmed' && toDate(b.date) >= toDate('2026-10-16')).sort((a, b) => a.date.localeCompare(b.date)),
      past: all.filter(b => b.status === 'confirmed' && toDate(b.date) < toDate('2026-10-16')).sort((a, b) => b.date.localeCompare(a.date)),
      cancelled: all.filter(b => b.status === 'cancelled')
    };
  };
  const label = { upcoming: 'Upcoming', past: 'Past', cancelled: 'Cancelled' };
  function render() {
    const g = groups();
    $('#tabs').innerHTML = Object.keys(label).map(k => `<button type="button" role="tab" aria-selected="${k === tab}" class="${k === tab ? 'active' : ''}" data-tab="${k}">${label[k]} <span class="muted">${g[k].length}</span></button>`).join('');
    const list = g[tab];
    $('#booking-list').innerHTML = list.map(b => {
      const d = toDate(b.date), deadline = new Date(d.getTime() - 2 * 864e5), canCancel = tab === 'upcoming' && deadline > TODAY;
      const days = Math.round((d - toDate('2026-10-16')) / 864e5);
      const status = tab === 'cancelled' ? '<span class="status off">Refunded</span>' : tab === 'past' ? '<span class="status muted-s">Attended</span>' : `<span class="status">${days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : 'In ' + days + ' days'}</span>`;
      const again = tab !== 'upcoming' && b.eventId && getEvent(b.eventId) ? `<a href="event.html?id=${b.eventId}" class="btn btn-outline btn-sm">Book again</a>` : '';
      return `<div class="booking reveal" data-id="${b.id}"><div class="art ${b.art}"></div>
        <div><span class="eyebrow" style="margin-bottom:2px">${fmtDate(b.date)} · ${fmtTime(b.time)}</span><h3 class="booking-title">${esc(b.title)}</h3><span class="muted small">${b.items.map(i => `${i.qty} × ${i.name}`).join(', ')} · ${esc(b.venue)}, ${esc(b.city)}</span></div>
        <div class="booking-side">${status}<div class="booking-actions">${tab !== 'cancelled' ? `<a href="confirmation.html?b=${b.id}" class="btn btn-outline btn-sm">View ticket</a>` : ''}${canCancel ? `<button type="button" class="btn btn-ghost btn-sm" data-cancel="${b.id}">Cancel</button>` : ''}${again}</div></div></div>`;
    }).join('');
    const empty = { upcoming: ['No upcoming tickets', 'Find your next event and it will show up here.'], past: ['Nothing here yet', 'Events you’ve attended will appear here.'], cancelled: ['No cancellations', 'Cancelled bookings and refunds will appear here.'] }[tab];
    $('#booking-empty').innerHTML = `${ICON.ticket}<h3>${list.length ? 'Looking for more?' : empty[0]}</h3><p>${list.length ? 'Find your next event and it will show up here.' : empty[1]}</p><a href="events.html" class="btn btn-primary btn-sm">Browse events</a>`;
    observeReveal($('#booking-list'));
  }
  $('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    tab = b.dataset.tab; history.replaceState(null, '', `bookings.html?tab=${tab}`); render();
  });
  $('#tabs').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const keys = Object.keys(label), i = keys.indexOf(tab);
    tab = keys[(i + (e.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length]; render(); $(`[data-tab="${tab}"]`).focus();
  });
  $('#booking-list').addEventListener('click', async e => {
    const btn = e.target.closest('[data-cancel]'); if (!btn) return;
    const all = store.get('bookings', []), b = all.find(x => x.id === btn.dataset.cancel);
    const ok = await dialog({ title: 'Cancel this booking?', body: `${esc(b.title)} on ${fmtDate(b.date)}. You’ll get a full refund of <b>${fmt(b.total)}</b> to your original payment method in 5–7 working days.`, ok: 'Cancel booking', cancel: 'Keep my tickets', danger: true });
    if (!ok) return;
    b.status = 'cancelled'; store.set('bookings', all); render();
    toast(`Booking cancelled. ${fmt(b.total)} refund is on its way.`, { href: 'bookings.html?tab=cancelled', label: 'View' });
  });
  render();
};

/* ---------- Saved ---------- */
pages.saved = () => {
  function render() {
    const list = store.get('saved', []).map(getEvent).filter(Boolean);
    $('#saved-grid').innerHTML = list.map(cardHTML).join('');
    observeReveal($('#saved-grid'));
    $('#saved-empty').hidden = list.length > 0;
    const drops = list.filter(e => e.was > e.price);
    $('#saved-note').innerHTML = drops.length ? `<div class="notice">${ICON.check}<span><b>${drops.length} saved event${drops.length > 1 ? 's have' : ' has'} dropped in price.</b> Book now while it lasts.</span></div>` : '';
    $('#saved-count').textContent = list.length ? `${list.length} event${list.length > 1 ? 's' : ''} you’re keeping an eye on. We’ll tell you when prices change or tickets run low.` : 'Tap the heart on any event to keep it here.';
  }
  document.addEventListener('savedchange', e => {
    if (e.detail.on) return;
    const card = $(`#saved-grid [data-id="${e.detail.id}"]`);
    if (!card || REDUCED) { render(); return; }
    card.classList.add('leaving'); setTimeout(render, 260);
  });
  render();
};

/* ---------- Log in ---------- */
// During a walkthrough, finishing a form continues to the flow's next step.
function tourNext() {
  const t = store.get('tour', null), f = t && FLOWS.find(x => x.id === t.id), s = f?.steps[t.i + 1];
  return s ? flowHref(s.page) : null;
}

pages.login = () => {
  const next = qs.get('next') || tourNext() || 'index.html';
  if (qs.get('next')) $('#login-sub').textContent = 'Log in to continue your booking.';
  if (next.startsWith('checkout')) $('#guest-row').hidden = false;
  const email = $('#email'), pw = $('#pw');
  const rules = [[email, emailRule], [pw, v => v.length >= 6 ? '' : 'Enter your password (at least 6 characters).']];
  liveValidate(rules);
  const signIn = (user, btn) => {
    setLoading(btn, true, 'Logging in…');
    setTimeout(() => { store.set('user', user); flash.set(`Welcome back, ${user.name.split(' ')[0]}.`); location.href = next; }, 700);
  };
  $('#login-form').addEventListener('submit', e => {
    e.preventDefault();
    if (!validateAll(rules)) return;
    const known = store.get('account', null);
    const v = email.value.trim();
    const name = known?.email === v ? known.name : v.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    signIn({ ...(known?.email === v ? known : {}), name, email: v }, $('#login-form button[type=submit]'));
  });
  $('#google').addEventListener('click', e => signIn({ name: 'Rut Vaghani', email: 'rut@example.com', city: 'Mumbai' }, e.currentTarget));
  $('#forgot').addEventListener('click', e => {
    e.preventDefault();
    if (!fieldError(email, emailRule(email.value.trim()))) { email.focus(); return; }
    toast(`Reset link sent to ${esc(email.value.trim())}.`);
  });
  $('#signup-link').href = 'signup.html' + (qs.get('next') ? '?next=' + encodeURIComponent(next) : '');
};

/* ---------- Sign up ---------- */
pages.signup = () => {
  const name = $('#name'), email = $('#semail'), pw = $('#spw');
  const bars = $$('#strength i'), label = $('#strength-label');
  pw.addEventListener('input', () => {
    const v = pw.value;
    const score = [v.length >= 8, /[A-Z]/.test(v), /\d/.test(v), /[^A-Za-z0-9]/.test(v)].filter(Boolean).length;
    bars.forEach((b, i) => b.classList.toggle('on', i < score));
    $('#strength').dataset.score = v ? score : 0;
    label.textContent = v ? ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][score] : '';
  });
  const rules = [[name, req('full name')], [email, emailRule], [pw, v => v.length < 8 ? 'Use at least 8 characters.' : !/\d/.test(v) ? 'Add at least one number.' : '']];
  liveValidate(rules);
  $('#signup-form').addEventListener('submit', e => {
    e.preventDefault();
    if (!validateAll(rules)) return;
    if (!$('#st').checked) { $('#st-row').classList.add('invalid'); $('#st').focus(); toast('Please accept the terms to create your account.'); return; }
    const btn = $('#signup-form button[type=submit]');
    setLoading(btn, true, 'Creating account…');
    const user = { name: name.value.trim(), email: email.value.trim(), city: 'Mumbai', since: 'Oct 2026' };
    setTimeout(() => {
      store.set('account', user); store.set('user', user);
      flash.set(`Account created. Welcome to Showtime, ${user.name.split(' ')[0]}.`);
      location.href = qs.get('next') || tourNext() || 'index.html';
    }, 800);
  });
  $('#st').addEventListener('change', () => $('#st-row').classList.remove('invalid'));
  $('#google').addEventListener('click', () => { store.set('user', { name: 'Rut Vaghani', email: 'rut@example.com', city: 'Mumbai' }); flash.set('Signed up with Google. Welcome, Rut.'); location.href = qs.get('next') || 'index.html'; });
};

/* ---------- Account settings ---------- */
pages.profile = () => {
  const user = store.get('user', null);
  if (!user) { flash.set('Log in to see your account settings.'); location.replace('login.html?next=profile.html'); return; }
  const p1 = $('#p1'), p2 = $('#p2'), p3 = $('#p3'), p4 = $('#p4');
  const paint = u => { $('#p-avatar').textContent = initials(u.name); $('#p-name').textContent = u.name; $('#p-since').textContent = `Member since ${u.since || 'Oct 2026'}`; };
  p1.value = user.name; p2.value = user.email; p3.value = user.phone || ''; p4.value = user.city || 'Mumbai'; paint(user);
  const rules = [[p1, req('full name')], [p2, emailRule], [p3, v => !v || v.replace(/\D/g, '').length >= 10 ? '' : 'Enter a 10-digit phone number.']];
  liveValidate(rules);
  $('#profile').addEventListener('submit', e => {
    e.preventDefault();
    if (!validateAll(rules)) return;
    const u = { ...user, name: p1.value.trim(), email: p2.value.trim(), phone: p3.value.trim(), city: p4.value };
    store.set('user', u); paint(u);
    const av = $('.avatar-btn .avatar'); if (av) av.textContent = initials(u.name);
    toast('Profile saved.');
  });
  const prefs = store.get('prefs', { remind: true, drops: true, recs: false });
  $$('[data-pref]').forEach(i => {
    i.checked = prefs[i.dataset.pref];
    i.addEventListener('change', () => { prefs[i.dataset.pref] = i.checked; store.set('prefs', prefs); toast(`${i.getAttribute('aria-label')} turned ${i.checked ? 'on' : 'off'}.`); });
  });
  $('#remove-card')?.addEventListener('click', async e => {
    if (!await dialog({ title: 'Remove this card?', body: 'You can add it again at checkout.', ok: 'Remove card', danger: true })) return;
    e.target.closest('.saved-card').outerHTML = '<p class="muted small" style="margin:0">No saved payment methods. Cards you use at checkout can be saved here.</p>';
    toast('Card removed.');
  });
  $('#security').addEventListener('submit', e => {
    e.preventDefault();
    const op = $('#op'), np = $('#np');
    if (!validateAll([[op, v => v ? '' : 'Enter your current password.'], [np, v => v.length < 8 ? 'Use at least 8 characters.' : v === op.value ? 'Choose a password different from your current one.' : '']])) return;
    op.value = np.value = ''; toast('Password updated.');
  });
};

/* ---------- Organizer dashboard ---------- */
pages.organizer = () => {
  const seed = [
    { title: 'Northern Lights Live', date: '2026-11-08', sold: 880, cap: 1000, rev: '₹13.2L', status: 'Live', href: 'event.html?id=northern-lights' },
    { title: 'Strings & Skyline', date: '2026-11-29', sold: 212, cap: 400, rev: '₹2.7L', status: 'Live', href: 'event.html?id=strings-skyline' }
  ];
  const mine = store.get('org_events', []).map(e => ({ title: e.title, date: e.date, sold: 0, cap: e.left, rev: '₹0', status: e.status, href: e.status === 'Live' ? `event.html?id=${e.id}` : `create-event.html?edit=${e.id}` }));
  const rows = [...mine, ...seed];
  $('#org-rows').innerHTML = rows.map(r => {
    const pct = Math.round(r.sold / r.cap * 100);
    return `<tr><td><b>${esc(r.title)}</b></td><td>${fmtDate(r.date).replace(/ \d{4}$/, '')}</td><td><div class="meter" aria-label="${pct}% sold"><i style="width:${pct}%"></i></div><span class="small muted">${r.sold.toLocaleString('en-IN')} / ${(+r.cap).toLocaleString('en-IN')}</span></td><td>${r.rev}</td><td><span class="status ${r.status === 'Draft' ? 'warn' : ''}">${r.status}</span></td><td><a href="${r.href}" class="link">${r.status === 'Draft' ? 'Edit' : 'View'}</a></td></tr>`;
  }).join('');
  $('#kpi-live').textContent = rows.filter(r => r.status === 'Live').length;
  $('#kpi-drafts').textContent = `${rows.filter(r => r.status === 'Draft').length} draft${rows.filter(r => r.status === 'Draft').length === 1 ? '' : 's'}`;

  // Chart with hover/focus values
  const data = { '7': [[42, 'Mon'], [58, 'Tue'], [51, 'Wed'], [74, 'Thu'], [66, 'Fri'], [94, 'Sat'], [110, 'Sun']], '30': [[210, 'W1'], [264, 'W2'], [301, 'W3'], [386, 'W4']] };
  const drawChart = range => {
    const d = data[range], max = Math.max(...d.map(x => x[0]));
    $('#chart').innerHTML = d.map(([v, l], i) => `<div tabindex="0" class="${i === d.length - 1 ? 'hi' : ''}" style="--h:${Math.round(v / max * 92)}%" data-v="${v} tickets" aria-label="${l}: ${v} tickets"></div>`).join('');
    $('#chart-labels').innerHTML = d.map(([, l]) => `<span>${l}</span>`).join('');
    requestAnimationFrame(() => $('#chart').classList.add('grown'));
    $('#chart-total').textContent = d.reduce((s, x) => s + x[0], 0).toLocaleString('en-IN') + ' tickets';
  };
  $$('[data-range]').forEach(b => b.addEventListener('click', () => {
    $$('[data-range]').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); });
    $('#chart').classList.remove('grown'); drawChart(b.dataset.range);
  }));
  drawChart('7');
};

/* ---------- Create event wizard ---------- */
pages['create-event'] = () => {
  const STEPS = 4; let step = 1, maxSeen = 1;
  const form = $('#event-form');
  const f = id => $('#' + id);
  const editing = store.get('org_events', []).find(e => e.id === qs.get('edit'));
  if (editing) {
    f('t').value = editing.title; f('cat').value = editing.cat; f('age').value = editing.age; f('d').value = editing.about;
    f('dt').value = editing.date; f('tm').value = editing.time; f('v').value = editing.venue; f('c').value = editing.city;
    f('n').value = editing.tier || 'General admission'; f('p').value = editing.price; f('cap').value = editing.left;
    $('#ce-title').innerHTML = 'Edit your <em>event</em>';
  }
  const data = () => ({
    title: f('t').value.trim(), cat: f('cat').value, age: f('age').value, about: f('d').value.trim(),
    date: f('dt').value, time: f('tm').value, venue: f('v').value.trim(), city: f('c').value,
    tier: f('n').value.trim(), price: +f('p').value, left: +f('cap').value
  });
  const rules = {
    1: [[f('t'), v => v.length >= 3 ? '' : 'Give your event a title (at least 3 characters).'], [f('d'), v => v.length >= 20 ? '' : 'Add a short description (at least 20 characters).']],
    2: [[f('dt'), v => !v ? 'Choose a date.' : toDate(v) <= TODAY ? 'Pick a date in the future.' : ''], [f('tm'), v => v ? '' : 'Choose a start time.'], [f('v'), v => v ? '' : 'Enter the venue name.']],
    3: [[f('n'), v => v ? '' : 'Name this ticket type.'], [f('p'), v => v !== '' && +v >= 0 ? '' : 'Enter a price (0 for free).'], [f('cap'), v => +v >= 1 ? '' : 'Capacity must be at least 1.']]
  };
  Object.values(rules).forEach(liveValidate);

  function preview() {
    const d = data(), e = { id: 'preview', title: d.title || 'Your event title', cat: d.cat, art: CAT_ART[d.cat], date: d.date || '2026-12-31', venue: d.venue || 'Venue', city: d.city, price: d.price || 0, left: d.left || 999 };
    $('#live-preview').innerHTML = cardHTML(e).replace(/<button class="heart".*?<\/button>/s, '').replace(/href="[^"]*"/g, 'href="#" onclick="return false"').replace('reveal', 'in');
    return d;
  }
  function show(n) {
    step = n; maxSeen = Math.max(maxSeen, n);
    $$('[data-step]', form).forEach(p => p.hidden = +p.dataset.step !== n);
    $$('.form-steps li').forEach((li, i) => {
      li.classList.toggle('on', i + 1 === n); li.classList.toggle('done', i + 1 < n);
      li.setAttribute('aria-current', i + 1 === n ? 'step' : 'false');
      $('button', li).disabled = i + 1 > maxSeen;
    });
    $('#prev').hidden = n === 1;
    $('#next').innerHTML = n === STEPS ? 'Publish event' : `Continue ${ICON.arrow}`;
    if (n === STEPS) {
      const d = preview();
      $('#review').innerHTML = `<ul class="info-list"><li><span>Title</span><span>${esc(d.title)}</span></li><li><span>Category</span><span>${d.cat} · ${d.age}</span></li><li><span>When</span><span>${fmtDate(d.date)} · ${fmtTime(d.time)}</span></li><li><span>Where</span><span>${esc(d.venue)}, ${d.city}</span></li><li><span>Tickets</span><span>${esc(d.tier)} · ${d.price ? fmt(d.price) : 'Free'} · ${d.left.toLocaleString('en-IN')} available</span></li></ul>
        <div class="review-edit">${['Basics', 'Date & venue', 'Tickets'].map((l, i) => `<button type="button" class="text-btn" data-goto="${i + 1}">Edit ${l.toLowerCase()}</button>`).join('')}</div>`;
    }
    $('.page-head').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
  }
  const valid = n => !rules[n] || validateAll(rules[n]);
  function save(status) {
    const d = data(), all = store.get('org_events', []);
    const id = editing?.id || d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4);
    const ev = { ...d, id, status, art: CAT_ART[d.cat], blurb: d.about.split('. ')[0].slice(0, 90), doors: '', pop: 50, lineup: [] };
    store.set('org_events', [ev, ...all.filter(e => e.id !== id)]);
    return ev;
  }

  $('#next').addEventListener('click', () => {
    if (!valid(step)) return;
    if (step < STEPS) { show(step + 1); return; }
    const btn = $('#next'); setLoading(btn, true, 'Publishing…');
    setTimeout(() => { const ev = save('Live'); flash.set(`“${esc(ev.title)}” is live and listed on Events.`); location.href = 'organizer.html'; }, 900);
  });
  $('#prev').addEventListener('click', () => show(step - 1));
  $('#draft').addEventListener('click', () => {
    if (!fieldError(f('t'), rules[1][0][1](f('t').value.trim()))) { show(1); f('t').focus(); return; }
    save('Draft'); flash.set('Draft saved. You can finish it any time.'); location.href = 'organizer.html';
  });
  $('.form-steps').addEventListener('click', e => { const b = e.target.closest('button'); if (b && !b.disabled) { const n = +b.dataset.go; if (n < step || valid(step)) show(n); } });
  form.addEventListener('click', e => { const b = e.target.closest('[data-goto]'); if (b) show(+b.dataset.goto); });
  form.addEventListener('input', preview);
  document.addEventListener('tourstep', () => { if (valid(1) && valid(2) && valid(3)) { maxSeen = STEPS; show(STEPS); } });

  // Cover image: click or drag and drop
  const drop = $('#upload'), file = $('#cover');
  const take = fl => {
    if (!fl || !fl.type.startsWith('image/')) { toast('Please choose a JPG or PNG image.'); return; }
    $('#upload-msg').innerHTML = `${ICON.check} <b>${esc(fl.name)}</b> added · <button type="button" class="text-btn" id="replace">Replace</button>`;
    drop.style.backgroundImage = `linear-gradient(rgba(250,248,244,.85), rgba(250,248,244,.85)), url(${URL.createObjectURL(fl)})`;
    drop.classList.add('has-file');
  };
  drop.addEventListener('click', e => { if (e.target.closest('button')) file.click(); });
  file.addEventListener('change', () => take(file.files[0]));
  ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('drag'); }));
  drop.addEventListener('drop', e => take(e.dataTransfer.files[0]));

  f('dt').min = '2026-10-17';
  preview(); show(1);
};

/* ---------- Help ---------- */
pages.help = () => {
  const items = $$('#faq details'), q = $('#hq');
  const filter = () => {
    const v = q.value.trim().toLowerCase(); let n = 0;
    items.forEach(d => { const hit = !v || d.textContent.toLowerCase().includes(v); d.hidden = !hit; if (hit) n++; if (v && hit) d.open = true; });
    $('#faq-empty').hidden = n > 0;
    $('#faq-count').textContent = v ? `${n} answer${n === 1 ? '' : 's'} for “${q.value.trim()}”` : '';
  };
  q.addEventListener('input', filter);
  $('#help-search').addEventListener('submit', e => { e.preventDefault(); filter(); $('#faq').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); });
  $$('[data-topic]').forEach(c => c.addEventListener('click', () => { q.value = c.dataset.topic; filter(); }));
  const user = store.get('user', null); if (user) $('#hn').value = user.email;
  const rules = [[$('#hn'), emailRule], [$('#hm'), v => v.length >= 10 ? '' : 'Tell us a little more (at least 10 characters).']];
  liveValidate(rules);
  $('#contact-form').addEventListener('submit', e => {
    e.preventDefault();
    if (!validateAll(rules)) return;
    const btn = $('#contact-form button[type=submit]'); setLoading(btn, true, 'Sending…');
    setTimeout(() => { setLoading(btn, false); $('#hm').value = ''; $('#hb').value = ''; toast('Message sent. We’ll reply within 24 hours.'); }, 800);
  });
  if (qs.get('q')) { q.value = qs.get('q'); filter(); }
};

/* ---------- Flow / sitemap ---------- */
pages.flow = () => {
  $('#flows').innerHTML = FLOWS.map((f, n) => `
    <section class="flow-block reveal">
      <div class="section-head"><h2>Flow ${n + 1} · ${f.name}${f.tag ? ` <em>(${f.tag.toLowerCase()})</em>` : ''}</h2><button type="button" class="btn btn-outline btn-sm" data-start="${f.id}">${ICON.arrow} Walk through it</button></div>
      <ol class="flow">${f.steps.map((s, i) => `${i ? '<li class="arrow" aria-hidden="true">→</li>' : ''}<li><a class="node ${i === 0 ? 'start' : i === f.steps.length - 1 ? 'end' : ''} ${s.err ? 'err' : ''}" href="${flowHref(s.page)}"><b>${s.label}</b><span>${s.note}</span></a></li>`).join('')}</ol>
    </section>`).join('');
  $('#flows').addEventListener('click', e => { const b = e.target.closest('[data-start]'); if (b) startTour(b.dataset.start); });
};

/* ==========================================================
   Boot
   ========================================================== */
renderHeader();
passwordToggles();
pages[PAGE]?.();
observeReveal();
renderTour();
const msg = flash.take(); if (msg) setTimeout(() => toast(msg), 250);

// Press “/” to search from anywhere
document.addEventListener('keydown', e => {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || /input|textarea|select/i.test(document.activeElement.tagName)) return;
  const field = $('[data-search]');
  e.preventDefault();
  if (field) field.focus(); else location.href = 'events.html?focus=1';
});
