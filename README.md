# Showtime – event booking prototype (HCI CA-3)

An interactive, high-fidelity prototype of an event ticketing site. Plain HTML, CSS and JavaScript with no build step and no backend. State (saved events, bookings, login, orders) lives in `localStorage`, so every flow works end to end.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765. Start at **flow.html** (footer → *User flow*) for the sitemap and guided walkthroughs.

## User flows covered

| # | Flow | Path |
|---|------|------|
| 1 | Book a ticket (primary) | Home → Events → Event details → Select tickets & seats → Review & pay → Confirmation |
| 2 | Returning user | Log in → Saved → Event details → Select tickets → Pay (pre-filled) → Ticket stored |
| 3 | Error recovery | Review & pay → Payment failed → Try again / switch method → Confirmation |
| 4 | New user sign-up | Sign up → Discover → Save events → Saved → Preferences |
| 5 | Manage a booking | My tickets → View ticket → Cancel (free until 48h before) → Help |
| 6 | Organizer | Dashboard → Create event (4 steps, live preview) → Review → Publish → Listed on Events |

Each flow on `flow.html` has a **Walk through it** button that shows a step tracker on every page as you follow the flow.

## Demo data

- Card `4242 4242 4242 4242` succeeds; `4000 0000 0000 0002` is declined (use any future expiry and CVV).
- Any email and password (6+ characters) logs in. *Continue with Google* signs in a demo user.
- The prototype's "today" is fixed at 16 Oct 2026 so dates, holds and cancellation windows stay consistent.
- To reset everything, clear the site's local storage.

## What's interactive

- **Discover:** search with city and date, category tiles, an "up next" ticker, hearts that save, and a press-`/`-to-search shortcut.
- **Events:** live search, category, city, date and price filters, removable filter pills, sorting, load more, an empty state, filters kept in the URL, and a full-screen filter sheet on mobile.
- **Event details:** price-drop and low-stock signals, save, share (copies the link), add to calendar (.ics), related events, and a sticky buy bar on mobile.
- **Tickets:** quantity steppers with an 8-ticket limit and a seat map that requires one seat per Premium ticket. The order total updates live, and a 10-minute hold timer warns in the last 2 minutes.
- **Checkout:** inline validation, card formatting with brand detection, Card, UPI and net banking options, and details pre-filled when logged in.
- **Payment failed:** a clear reason, the order kept, the timer still running, and one-click retry or switch method.
- **Confirmation:** a QR e-ticket, print/download, add to calendar, and the next steps.
- **Account:** log in and sign up (password strength meter, show/hide), a header account menu, profile, notification and payment settings, My tickets with tabs, and cancellation with a confirmation dialog.
- **Organizer:** KPIs, an interactive sales chart (7 / 30 days), a 4-step event wizard with a live preview, drafts, and publishing.
- **Help:** searchable FAQ with topic chips, and a contact form.

## HCI principles

Visibility of system status, error prevention and recovery, consistency, recognition over recall, user control and freedom, feedback, flexibility and efficiency, help and documentation, and accessibility. Accessibility covers labelled fields, announced errors, keyboard-operable seats, tabs and chart, a skip link, visible focus, and `prefers-reduced-motion` support. See `flow.html` for how each principle is applied.

## Wireframes (Figma)

Low-fidelity wireframes are generated from the real pages, so they match the built layout exactly:

- `wireframes/desktop/` has all 17 pages at 1440 px. `wireframes/mobile/` has 8 key pages at 390 px.
- `wireframes/flows/` has one board per user flow, with each step's wireframe and arrows between them.
- `wireframes/index.html` is a gallery of everything.

To use them in Figma, drag the `.svg` files onto the canvas. Each becomes a frame with editable text (Inter and Fraunces) and shapes.

To regenerate after changing a page, serve the site on port 8765 and run `./wireframes/export.sh && python3 wireframes/flows.py`.

## Photos

Event photos are from [Unsplash](https://unsplash.com) (free to use under the Unsplash License) and are stored locally in `images/events/`, so the prototype works offline. Each event uses `images/events/<event-id>.jpg`. Events created by organizers use a default photo for their category. The original CSS poster art still shows as a placeholder while a photo loads.

## Files

```
index.html … 404.html   17 pages
css/styles.css          design system + components
js/data.js              mock events, flows, localStorage store
js/main.js              shared UI + one module per page
images/events/          event photos (Unsplash)
```
