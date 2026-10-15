"""Builds wireframes/flows/*.svg: one board per user flow, laying out the
desktop wireframe for each step (top 1000 px) left to right with arrows.
Run after export.sh:  python3 wireframes/flows.py
"""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, 'desktop')
FILES = {f[:2]: f for f in os.listdir(D) if f.endswith('.svg')}
PAGE = {'index': '01', 'events': '02', 'event': '03', 'tickets': '04', 'checkout': '05', 'payment-failed': '06',
        'confirmation': '07', 'saved': '08', 'bookings': '09', 'login': '10', 'signup': '11', 'profile': '12',
        'organizer': '13', 'create-event': '14', 'help': '15'}

# Same flows as js/data.js (FLOWS).
FLOWS = [
  ('1', 'Book a ticket (primary)', [('index', 'Home', 'Search or browse'), ('events', 'Events', 'Filter & sort'), ('event', 'Event details', 'Date, venue, price'), ('tickets', 'Select tickets', 'Quantity or seats'), ('checkout', 'Review & pay', 'Guest or logged in'), ('confirmation', 'Confirmation', 'QR e-ticket')]),
  ('2', 'Returning user', [('login', 'Log in', 'Email or Google'), ('saved', 'Saved', 'Revisit wishlist'), ('event', 'Event details', 'Price dropped?'), ('tickets', 'Select tickets', 'Pick seats'), ('checkout', 'Pay', 'Details pre-filled'), ('confirmation', 'Ticket stored', 'In My tickets')]),
  ('3', 'Error recovery', [('checkout', 'Review & pay', 'Card declined'), ('payment-failed', 'Payment failed', 'Clear reason, no charge'), ('checkout', 'Try again', 'Tickets still held'), ('confirmation', 'Confirmation', 'Booked')]),
  ('4', 'New user sign-up', [('signup', 'Sign up', 'Name, email, password'), ('index', 'Discover', 'Personal welcome'), ('events', 'Save events', 'Tap the heart'), ('saved', 'Saved', 'Wishlist builds up'), ('profile', 'Preferences', 'City & alerts')]),
  ('5', 'Manage a booking', [('bookings', 'My tickets', 'Upcoming, past, cancelled'), ('confirmation', 'View ticket', 'QR, calendar, download'), ('bookings', 'Cancel', 'Free until 48h before'), ('help', 'Get help', 'Searchable FAQ')]),
  ('6', 'Organizer', [('organizer', 'Dashboard', 'Overview'), ('create-event', 'Create event', 'Basics, venue, tickets'), ('create-event', 'Review', 'Live preview'), ('organizer', 'Publish & track', 'Goes live')]),
]

SCALE, CROP_H, GAP, PAD = 0.25, 1000, 72, 48
FW, FH = 1440 * SCALE, CROP_H * SCALE
FONT = 'Inter, Helvetica, Arial, sans-serif'
esc = lambda s: s.replace('&', '&amp;').replace('<', '&lt;')

def inner(code):
  s = open(os.path.join(D, FILES[code])).read()
  return re.sub(r'^<svg[^>]*>|</svg>\s*$', '', s.strip()).replace('<title>', '<!--').replace('</title>', '-->')

os.makedirs(os.path.join(HERE, 'flows'), exist_ok=True)
for num, name, steps in FLOWS:
  W = PAD * 2 + len(steps) * FW + (len(steps) - 1) * GAP
  H = PAD + 70 + FH + 90 + PAD
  out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.0f}" height="{H:.0f}" viewBox="0 0 {W:.0f} {H:.0f}"><title>Flow {num} - {esc(name)}</title>',
         f'<rect width="{W:.0f}" height="{H:.0f}" fill="#f4f4f2"/>',
         f'<text x="{PAD}" y="{PAD + 28}" font-family="Fraunces, Georgia, serif" font-size="28" font-weight="600" fill="#222">Flow {num} · {esc(name)}</text>']
  for i, (page, label, note) in enumerate(steps):
    x, y = PAD + i * (FW + GAP), PAD + 70
    kind = 'start' if i == 0 else 'end' if i == len(steps) - 1 else 'err' if page == 'payment-failed' else ''
    out.append(f'<g><svg x="{x:.1f}" y="{y}" width="{FW:.1f}" height="{FH:.1f}" viewBox="0 0 1440 {CROP_H}">{inner(PAGE[page])}</svg>'
               f'<rect x="{x:.1f}" y="{y}" width="{FW:.1f}" height="{FH:.1f}" rx="6" fill="none" stroke="{"#4d4d4d" if kind in ("start", "end") else "#b33" if kind == "err" else "#bdbdbd"}" stroke-width="{2 if kind else 1}"/></g>')
    out.append(f'<circle cx="{x + 14:.1f}" cy="{y + FH + 30:.1f}" r="12" fill="{"#4d4d4d" if kind in ("start", "end") else "#fff"}" stroke="#4d4d4d"/>'
               f'<text x="{x + 14:.1f}" y="{y + FH + 34.5:.1f}" text-anchor="middle" font-family="{FONT}" font-size="12" font-weight="600" fill="{"#fff" if kind in ("start", "end") else "#222"}">{i + 1}</text>'
               f'<text x="{x + 34:.1f}" y="{y + FH + 35:.1f}" font-family="{FONT}" font-size="15" font-weight="600" fill="#222">{esc(label)}</text>'
               f'<text x="{x + 34:.1f}" y="{y + FH + 56:.1f}" font-family="{FONT}" font-size="13" fill="{"#b33" if kind == "err" else "#777"}">{esc(note)}</text>')
    if i < len(steps) - 1:
      ax, ay = x + FW + 10, y + FH / 2
      out.append(f'<path d="M{ax:.1f} {ay:.1f}H{ax + GAP - 20:.1f}" stroke="#4d4d4d" stroke-width="2"/><path d="M{ax + GAP - 28:.1f} {ay - 7:.1f}L{ax + GAP - 20:.1f} {ay:.1f}L{ax + GAP - 28:.1f} {ay + 7:.1f}" fill="none" stroke="#4d4d4d" stroke-width="2"/>')
  out.append('</svg>')
  fn = os.path.join(HERE, 'flows', f'Flow {num} - {name.replace(" (primary)", "")}.svg')
  open(fn, 'w').write(''.join(out))
  print('ok', os.path.basename(fn))
