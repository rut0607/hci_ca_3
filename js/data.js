/* ==========================================================
   Showtime – demo data + tiny localStorage store.
   Everything here is mock data so every flow works end to end
   without a backend.
   ========================================================== */

// Fixed "today" keeps dates, hold rules and cancellation windows
// consistent whenever the prototype is demoed.
const TODAY = new Date('2026-10-16T10:00:00');

const EVENTS = [
  { id: 'northern-lights', title: 'Northern Lights Live', cat: 'Concert', art: 'art-1', date: '2026-11-08', time: '19:30', doors: '18:00', venue: 'Jio World Garden', city: 'Mumbai', area: 'Bandra Kurla Complex', station: 'Bandra (Western line)', price: 1499, left: 120, pop: 98, age: '16+',
    blurb: 'Indie and alternative under open skies. Three bands, one stage.',
    about: 'An evening of indie and alternative music under open skies, featuring three bands across one stage. Food and beverage stalls are available on site, and a cloakroom is free for ticket holders.',
    lineup: [['Paper Lanterns', '7:30 PM · Opening act'], ['Harbour Lights', '8:30 PM · Support'], ['Northern Lights', '9:45 PM · Headliner']] },
  { id: 'kala-theatre', title: 'Kala Theatre Weekend', cat: 'Theatre', art: 'art-6', date: '2026-10-17', time: '18:00', doors: '17:30', venue: 'Prithvi Theatre', city: 'Mumbai', area: 'Juhu', station: 'Vile Parle (Western line)', price: 599, left: 34, pop: 74, age: 'All ages',
    blurb: 'Two short plays and a conversation with the cast.', about: 'A weekend of new Indian writing for the stage: two short plays followed by an open conversation with the cast and director.',
    lineup: [['The Last Train', '6:00 PM · Play one'], ['Monsoon Letters', '7:15 PM · Play two'], ['Cast Q&A', '8:20 PM · Conversation']] },
  { id: 'jazz-brunch', title: 'Sunday Jazz Brunch', cat: 'Concert', art: 'art-4', date: '2026-10-18', time: '12:00', doors: '11:30', venue: 'Blue Terrace', city: 'Mumbai', area: 'Lower Parel', station: 'Lower Parel (Western line)', price: 999, left: 60, pop: 66, age: 'All ages',
    blurb: 'A slow Sunday with a live quartet and good coffee.', about: 'A relaxed afternoon set from a four-piece jazz quartet. Brunch menu available to order at your table.',
    lineup: [['The Bandra Quartet', '12:30 PM · Set one'], ['The Bandra Quartet', '2:00 PM · Set two']] },
  { id: 'city-derby', title: 'Mumbai City vs Bengaluru FC', cat: 'Sports', art: 'art-7', date: '2026-10-18', time: '19:30', doors: '18:00', venue: 'Mumbai Football Arena', city: 'Mumbai', area: 'Andheri Sports Complex', station: 'Andheri (Western line)', price: 450, left: 800, pop: 90, age: 'All ages',
    blurb: 'The west-coast derby, under the lights.', about: 'A league fixture between two of the top sides in the country. Gates open ninety minutes before kick-off.',
    lineup: [['Gates open', '6:00 PM'], ['Kick-off', '7:30 PM'], ['Full time', '9:20 PM']] },
  { id: 'late-night', title: 'The Late Night Stand-up', cat: 'Comedy', art: 'art-2', date: '2026-11-14', time: '20:00', doors: '19:30', venue: 'Phoenix Hall', city: 'Mumbai', area: 'Lower Parel', station: 'Lower Parel (Western line)', price: 799, left: 22, pop: 88, age: '18+',
    blurb: 'Four comics, one mic, no filter.', about: 'A late-night line-up of four stand-up comedians trying out new material. Strictly 18+.',
    lineup: [['Host set', '8:00 PM'], ['Three featured comics', '8:15 PM'], ['Headliner', '9:30 PM']] },
  { id: 'monsoon-sessions', title: 'Monsoon Sessions Festival', cat: 'Festival', art: 'art-3', date: '2026-11-21', time: '16:00', doors: '15:00', venue: 'Mahalaxmi Racecourse', city: 'Mumbai', area: 'Mahalaxmi', station: 'Mahalaxmi (Western line)', price: 2199, left: 40, pop: 95, age: '16+',
    blurb: 'Eight hours, two stages, twelve artists.', about: 'A one-day music festival across two stages with food courts, a craft market and a chill-out zone.',
    lineup: [['Stage A opens', '4:00 PM'], ['Sunset set', '6:30 PM'], ['Closing headliner', '10:30 PM']] },
  { id: 'strings-skyline', title: 'Strings & Skyline', cat: 'Concert', art: 'art-4', date: '2026-11-29', time: '19:00', doors: '18:30', venue: 'NCPA', city: 'Mumbai', area: 'Nariman Point', station: 'Churchgate (Western line)', price: 1299, was: 1599, left: 180, pop: 70, age: 'All ages',
    blurb: 'A chamber orchestra plays film scores by the sea.', about: 'A chamber orchestra performs reimagined film scores, from classic Hindi cinema to modern soundtracks.',
    lineup: [['First half', '7:00 PM'], ['Interval', '8:00 PM'], ['Second half', '8:20 PM']] },
  { id: 'electric-avenue', title: 'Electric Avenue Tour', cat: 'Concert', art: 'art-5', date: '2026-12-05', time: '18:30', doors: '17:00', venue: 'MMRDA Grounds', city: 'Mumbai', area: 'Bandra Kurla Complex', station: 'Bandra (Western line)', price: 1799, was: 1999, left: 300, pop: 92, age: '16+',
    blurb: 'Electronic heavyweights on a full arena rig.', about: 'An electronic music tour with a full light and laser production. Re-entry is not permitted.',
    lineup: [['Warm-up', '6:30 PM'], ['Main set', '8:30 PM'], ['Close', '11:00 PM']] },
  { id: 'indie-nights', title: 'Indie Nights Bengaluru', cat: 'Concert', art: 'art-1', date: '2026-11-15', time: '20:00', doors: '19:00', venue: 'Windmills', city: 'Bengaluru', area: 'Whitefield', station: 'Kadugodi (Purple line)', price: 899, left: 75, pop: 64, age: '18+',
    blurb: 'New bands from the city, in a room that sounds great.', about: 'Three up-and-coming indie bands from Bengaluru play original sets.',
    lineup: [['Band one', '8:00 PM'], ['Band two', '9:00 PM'], ['Band three', '10:00 PM']] },
  { id: 'hamlet-retold', title: 'Hamlet, Retold', cat: 'Theatre', art: 'art-6', date: '2026-11-28', time: '19:30', doors: '19:00', venue: 'Ranga Shankara', city: 'Bengaluru', area: 'JP Nagar', station: 'Jayanagar (Green line)', price: 599, left: 90, pop: 58, age: '12+',
    blurb: 'Shakespeare, set in a 1990s Bengaluru office.', about: 'A ninety-minute, five-actor adaptation of Hamlet set in a software office at the turn of the millennium.',
    lineup: [['Performance', '7:30 PM · 90 minutes, no interval']] },
  { id: 'laugh-riot', title: 'Laugh Riot Delhi', cat: 'Comedy', art: 'art-2', date: '2026-11-22', time: '19:00', doors: '18:30', venue: 'Siri Fort Auditorium', city: 'Delhi', area: 'Siri Fort', station: 'Hauz Khas (Yellow line)', price: 699, left: 140, pop: 80, age: '16+',
    blurb: 'Five of the country’s sharpest sets in one night.', about: 'A comedy showcase with five comedians, each doing a twenty-minute set.',
    lineup: [['Show', '7:00 PM · 2 hours']] },
  { id: 'sufi-stars', title: 'Sufi Under the Stars', cat: 'Concert', art: 'art-4', date: '2026-12-19', time: '19:00', doors: '18:00', venue: 'Sunder Nursery', city: 'Delhi', area: 'Nizamuddin', station: 'JLN Stadium (Violet line)', price: 1499, left: 210, pop: 77, age: 'All ages',
    blurb: 'Qawwali in a 16th-century garden.', about: 'An open-air evening of Sufi and qawwali music in a restored heritage garden.',
    lineup: [['Opening', '7:00 PM'], ['Main performance', '8:00 PM']] },
  { id: 'pune-lit', title: 'Pune Arts & Letters Fest', cat: 'Festival', art: 'art-3', date: '2026-12-12', time: '10:00', doors: '09:30', venue: 'Bal Gandharva Rang Mandir', city: 'Pune', area: 'Shivajinagar', station: 'Shivajinagar', price: 499, left: 500, pop: 55, age: 'All ages',
    blurb: 'Talks, readings and workshops all day.', about: 'A one-day festival of talks, readings, workshops and a book market.',
    lineup: [['Morning talks', '10:00 AM'], ['Workshops', '1:00 PM'], ['Evening readings', '5:00 PM']] },
  { id: 't20-night', title: 'T20 Night: Mumbai vs Delhi', cat: 'Sports', art: 'art-7', date: '2026-11-07', time: '19:00', doors: '17:00', venue: 'Wankhede Stadium', city: 'Mumbai', area: 'Churchgate', station: 'Churchgate (Western line)', price: 1199, left: 1500, pop: 96, age: 'All ages',
    blurb: 'Floodlit cricket. Twenty overs a side.', about: 'A floodlit T20 exhibition match. Bags larger than A4 are not allowed inside the stadium.',
    lineup: [['Gates open', '5:00 PM'], ['First ball', '7:00 PM'], ['Expected finish', '10:30 PM']] }
];

const CATEGORIES = ['Concert', 'Comedy', 'Festival', 'Theatre', 'Sports'];
const CITIES = ['Mumbai', 'Bengaluru', 'Delhi', 'Pune'];
const CAT_ART = { Concert: 'art-1', Comedy: 'art-2', Festival: 'art-3', Theatre: 'art-6', Sports: 'art-7' };

/* ---------- Store (safe localStorage) ---------- */
const store = {
  get(k, fallback) { try { const v = localStorage.getItem('st_' + k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem('st_' + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem('st_' + k); } catch {} }
};
const flash = {
  set(msg) { try { sessionStorage.setItem('st_flash', msg); } catch {} },
  take() { try { const m = sessionStorage.getItem('st_flash'); sessionStorage.removeItem('st_flash'); return m; } catch { return null; } }
};

/* ---------- Helpers ---------- */
const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const toDate = iso => new Date(iso + 'T00:00:00');
const fmtDate = iso => { const d = toDate(iso); return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const fmtTime = t => { if (!t) return ''; let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const qs = new URLSearchParams(location.search);

// Organizer-published events join the public catalogue.
function allEvents() {
  const mine = store.get('org_events', []).filter(e => e.status === 'Live');
  return [...EVENTS, ...mine];
}
const getEvent = id => allEvents().find(e => e.id === id);

function tiersFor(e) {
  const r = n => Math.max(99, Math.round(n / 100) * 100 - 1);
  return [
    { key: 'ga', name: 'General admission', note: 'Standing area', price: e.price },
    { key: 'premium', name: 'Premium seated', note: 'Reserved seat · pick on the map', price: r(e.price * 2), seated: true, low: true },
    { key: 'vip', name: 'VIP lounge', note: 'Seat and lounge access', price: r(e.price * 3.6) }
  ];
}

const FEE_RATE = 0.05;
function orderTotals(order) {
  const sub = order.items.reduce((s, i) => s + i.qty * i.price, 0);
  const fee = Math.round(sub * FEE_RATE);
  return { count: order.items.reduce((s, i) => s + i.qty, 0), sub, fee, total: sub + fee };
}

/* ---------- Seeds ---------- */
if (store.get('saved', null) === null) store.set('saved', ['monsoon-sessions', 'strings-skyline', 'electric-avenue']);
if (store.get('bookings', null) === null) {
  store.set('bookings', [
    { id: 'SHT-482913', eventId: 'northern-lights', title: 'Northern Lights Live', art: 'art-1', cat: 'Concert', date: '2026-11-08', time: '19:30', venue: 'Jio World Garden', city: 'Mumbai', items: [{ name: 'General admission', qty: 2, price: 1499 }], seats: [], total: 3148, status: 'confirmed' },
    { id: 'SHT-471120', eventId: 'late-night', title: 'The Late Night Stand-up', art: 'art-2', cat: 'Comedy', date: '2026-11-14', time: '20:00', venue: 'Phoenix Hall', city: 'Mumbai', items: [{ name: 'General admission', qty: 1, price: 799 }], seats: [], total: 839, status: 'confirmed' },
    { id: 'SHT-402277', title: 'Rooftop Sessions Vol. 3', art: 'art-4', cat: 'Concert', date: '2026-09-12', time: '20:00', venue: 'Sky Lounge', city: 'Mumbai', items: [{ name: 'General admission', qty: 2, price: 899 }], seats: [], total: 1888, status: 'confirmed' },
    { id: 'SHT-389014', title: 'Monsoon Comedy Hour', art: 'art-2', cat: 'Comedy', date: '2026-08-22', time: '19:00', venue: 'The Habitat', city: 'Mumbai', items: [{ name: 'General admission', qty: 1, price: 599 }], seats: [], total: 629, status: 'confirmed' },
    { id: 'SHT-410552', title: 'Tughlaq: A Staged Reading', art: 'art-6', cat: 'Theatre', date: '2026-10-02', time: '19:00', venue: 'Prithvi Theatre', city: 'Mumbai', items: [{ name: 'General admission', qty: 2, price: 499 }], seats: [], total: 1048, status: 'cancelled' }
  ]);
}

/* ---------- User flows (shared by flow.html and the guided walkthrough) ---------- */
const FLOWS = [
  { id: 'book', name: 'Book a ticket', tag: 'Primary', steps: [
    { page: 'index', label: 'Home', note: 'Search or browse' },
    { page: 'events', label: 'Events', note: 'Filter & sort' },
    { page: 'event', label: 'Event details', note: 'Date, venue, price' },
    { page: 'tickets', label: 'Select tickets', note: 'Quantity or seats' },
    { page: 'checkout', label: 'Review & pay', note: 'Guest or logged in' },
    { page: 'confirmation', label: 'Confirmation', note: 'QR e-ticket' }] },
  { id: 'returning', name: 'Returning user', steps: [
    { page: 'login', label: 'Log in', note: 'Email or Google' },
    { page: 'saved', label: 'Saved', note: 'Revisit wishlist' },
    { page: 'event', label: 'Event details', note: 'Price dropped?' },
    { page: 'tickets', label: 'Select tickets', note: 'Pick seats' },
    { page: 'checkout', label: 'Pay', note: 'Details pre-filled' },
    { page: 'confirmation', label: 'Ticket stored', note: 'In My tickets' }] },
  { id: 'recovery', name: 'Error recovery', steps: [
    { page: 'checkout', label: 'Review & pay', note: 'Test card 4000 0000 0000 0002' },
    { page: 'payment-failed', label: 'Payment failed', note: 'Clear reason, no charge', err: true },
    { page: 'checkout', label: 'Try again', note: 'Tickets still held' },
    { page: 'confirmation', label: 'Confirmation', note: 'Booked' }] },
  { id: 'newuser', name: 'New user sign-up', steps: [
    { page: 'signup', label: 'Sign up', note: 'Name, email, password' },
    { page: 'index', label: 'Discover', note: 'Personal welcome' },
    { page: 'events', label: 'Save events', note: 'Tap the heart' },
    { page: 'saved', label: 'Saved', note: 'Wishlist builds up' },
    { page: 'profile', label: 'Preferences', note: 'City & alerts' }] },
  { id: 'manage', name: 'Manage a booking', steps: [
    { page: 'bookings', label: 'My tickets', note: 'Upcoming, past, cancelled' },
    { page: 'confirmation', label: 'View ticket', note: 'QR, calendar, download' },
    { page: 'bookings', label: 'Cancel', note: 'Free until 48h before' },
    { page: 'help', label: 'Get help', note: 'Searchable FAQ' }] },
  { id: 'organizer', name: 'Organizer', steps: [
    { page: 'organizer', label: 'Dashboard', note: 'Overview' },
    { page: 'create-event', label: 'Create event', note: 'Basics, venue, tickets' },
    { page: 'create-event', label: 'Review', note: 'Live preview' },
    { page: 'organizer', label: 'Publish & track', note: 'Goes live' }] }
];
