// Organizes the imported Showtime wireframes in a Figma file.
// Run it in the browser's JavaScript console on the open Figma file
// (Chrome: View > Developer > JavaScript Console, or Option+Cmd+J).
// It finds the imported frames by name, wherever they are, and builds:
//   Cover · User flows · Desktop wireframes · Mobile wireframes
// with each group in a labelled Figma section.
(async () => {
  const log = (...a) => console.log('%c[Showtime]', 'color:#0f5c5c;font-weight:bold', ...a);
  if (typeof figma === 'undefined') { console.error('Open the Figma design file first, then run this in its console.'); return; }

  await Promise.all([
    figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' })
  ]);

  // 1. Collect imported frames from every page.
  const all = [];
  for (const page of figma.root.children) {
    if (page.loadAsync) await page.loadAsync();
    for (const n of page.children) all.push(n);
  }
  const kind = n => /^Flow\b/i.test(n.name) ? 'flow' : /^Desktop\b/i.test(n.name) ? 'desktop' : /^Mobile\b/i.test(n.name) ? 'mobile' : null;
  const frames = all.filter(n => kind(n));
  if (!frames.length) { console.error('No imported wireframes found (expected frames named "Desktop …", "Mobile …", "Flow - …").'); return; }
  log(`Found ${frames.length} wireframes.`);

  // Leftover test frames from the earlier paste attempt.
  all.filter(n => n.type === 'FRAME' && n.findOne && n.findOne(t => t.type === 'TEXT' && t.characters === 'Paste test')).forEach(n => n.remove());

  // 2. Pages, in order.
  const getPage = (name, i) => {
    let p = figma.root.children.find(p => p.name === name);
    if (!p) p = figma.createPage();
    p.name = name; figma.root.insertChild(i, p); return p;
  };
  const pCover = getPage('Cover', 0), pFlows = getPage('User flows', 1), pDesk = getPage('Desktop wireframes (1440)', 2), pMob = getPage('Mobile wireframes (390)', 3);

  // Clean names: "Desktop 03 Event details" -> "03 Event details", "Flow - 1 Book a ticket" -> "Flow 1 · Book a ticket".
  const clean = n => n.name.replace(/^Desktop\s+/i, '').replace(/^Mobile\s+/i, '').replace(/^Flow\s*-\s*(\d)\s*/i, 'Flow $1 · ');
  const num = n => parseInt((n.name.match(/(\d+)/) || [0, 99])[1], 10);
  const by = k => frames.filter(n => kind(n) === k).sort((a, b) => num(a) - num(b));

  // Put frames in a Figma section laid out left to right, wrapping after `cols`.
  const section = (page, title, nodes, x, y, { cols = 99, gap = 120, pad = 80 } = {}) => {
    const s = figma.createSection(); s.name = title; page.appendChild(s); s.x = x; s.y = y;
    let cx = pad, cy = pad, rowH = 0, maxW = 0, col = 0;
    for (const n of nodes) {
      s.appendChild(n); n.name = clean(n); n.x = cx; n.y = cy;
      rowH = Math.max(rowH, n.height); maxW = Math.max(maxW, cx + n.width);
      if (++col === cols) { col = 0; cx = pad; cy += rowH + gap; rowH = 0; } else cx += n.width + gap;
    }
    s.resizeWithoutConstraints(maxW + pad, cy + rowH + pad);
    return s;
  };

  // 3. User flows: one section per flow, stacked.
  let y = 0;
  for (const f of by('flow')) { const s = section(pFlows, clean(f), [f], 0, y, { pad: 60 }); y += s.height + 160; }

  // 4. Desktop: grouped like the sitemap.
  const desk = by('desktop'), pick = ids => desk.filter(n => ids.includes(num(n)));
  const groups = [
    ['Discover', [1, 2, 3, 8]],
    ['Book', [4, 5, 6, 7]],
    ['Account', [9, 10, 11, 12]],
    ['Organizer', [13, 14]],
    ['Support & documentation', [15, 16, 17]]
  ];
  y = 0;
  for (const [title, ids] of groups) {
    const nodes = pick(ids); if (!nodes.length) continue;
    const s = section(pDesk, title, nodes, 0, y, { gap: 160, pad: 100 }); y += s.height + 240;
  }
  const leftover = desk.filter(n => n.parent && n.parent.type !== 'SECTION');
  if (leftover.length) section(pDesk, 'Other', leftover, 0, y, { gap: 160, pad: 100 });

  // 5. Mobile: one row.
  section(pMob, 'Mobile · 390 px', by('mobile'), 0, 0, { gap: 100, pad: 80 });

  // 6. Cover.
  pCover.children.forEach(n => n.remove());
  const cover = figma.createFrame(); cover.name = 'Cover'; cover.resize(1600, 900); pCover.appendChild(cover);
  cover.fills = [{ type: 'SOLID', color: { r: .98, g: .97, b: .955 } }];
  const add = (text, size, style, x, y, color = { r: .1, g: .13, b: .12 }) => {
    const t = figma.createText(); t.fontName = { family: 'Inter', style }; t.fontSize = size; t.characters = text;
    t.fills = [{ type: 'SOLID', color }]; t.x = x; t.y = y; cover.appendChild(t); return t;
  };
  add('HCI CA-3 · DESIGN DOCUMENTATION', 18, 'Semi Bold', 120, 140, { r: .06, g: .36, b: .36 });
  add('Showtime — Wireframes', 88, 'Semi Bold', 120, 190);
  add('Low-fidelity wireframes generated from the built HTML/CSS prototype,\nso every frame matches the real layout.', 28, 'Regular', 120, 330, { r: .4, g: .44, b: .43 });
  add('Pages in this file', 22, 'Semi Bold', 120, 500);
  add(`User flows — ${by('flow').length} flows, step by step\nDesktop wireframes — ${desk.length} pages at 1440 px, grouped by sitemap\nMobile wireframes — ${by('mobile').length} key pages at 390 px`, 24, 'Regular', 120, 545);
  add('Booking flow: Home → Events → Event details → Select tickets → Review & pay → Confirmation', 20, 'Regular', 120, 760, { r: .4, g: .44, b: .43 });

  // 7. Remove pages left empty by the move (keeps the four above).
  for (const p of [...figma.root.children]) {
    if ([pCover, pFlows, pDesk, pMob].includes(p)) continue;
    if (p.loadAsync) await p.loadAsync();
    if (!p.children.length) p.remove();
  }

  if (figma.setCurrentPageAsync) await figma.setCurrentPageAsync(pCover); else figma.currentPage = pCover;
  figma.viewport.scrollAndZoomIntoView([cover]);
  log('Done: Cover, User flows, Desktop wireframes (1440), Mobile wireframes (390). Rename the file by double-clicking "Untitled" at the top.');
})();
