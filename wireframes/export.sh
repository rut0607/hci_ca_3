#!/bin/bash
# Regenerates every wireframe SVG from the live pages using headless Chrome.
# Needs the site served at localhost:8765 (python3 -m http.server 8765).
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE="http://localhost:8765/wireframes/generator.html"
mkdir -p desktop mobile
render() { # $1 page  $2 width  $3 outfile  $4 extra query
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=6000 \
    --user-data-dir="$(mktemp -d)" --window-size="$(( $2 + 40 )),900" \
    --dump-dom "$BASE?page=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=''))" "$1")&w=$2$4" 2>/dev/null \
  | python3 -c 'import sys,html,re; m=re.search(r"<textarea id=\"out\">(.*?)</textarea>", sys.stdin.read(), re.S); sys.stdout.write(html.unescape(m.group(1)) if m else "")' > "$3"
  [ -s "$3" ] && echo "ok   $3" || echo "FAIL $3"
}
while IFS='|' read -r n page name q; do
  render "$page" 1440 "desktop/$n $name.svg" "$q"
done <<'LIST'
01|index.html|Home|
02|events.html|Events - search and filter|
03|event.html?id=northern-lights|Event details|
04|tickets.html?id=northern-lights|Select tickets and seats|
05|checkout.html|Review and pay|
06|payment-failed.html|Payment failed|
07|confirmation.html?b=SHT-482913&new=1|Confirmation|
08|saved.html|Saved events|
09|bookings.html|My tickets|
10|login.html|Log in|
11|signup.html|Sign up|
12|profile.html|Account settings|&user=1
13|organizer.html|Organizer dashboard|
14|create-event.html|Create event|
15|help.html|Help centre|
16|404.html|404|
17|flow.html|Sitemap and user flows|
LIST
while IFS='|' read -r n page name q; do
  render "$page" 390 "mobile/$n $name.svg" "$q"
done <<'LIST'
01|index.html|Home|
02|events.html|Events|
03|event.html?id=northern-lights|Event details|
04|tickets.html?id=northern-lights|Select tickets|
05|checkout.html|Review and pay|
07|confirmation.html?b=SHT-482913&new=1|Confirmation|
09|bookings.html|My tickets|
10|login.html|Log in|
LIST
