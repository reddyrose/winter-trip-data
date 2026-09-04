# Where To This Winter — trip poll

An interactive poll where friends rank their top 3 winter-trip destinations.
Votes are stored in a Google Sheet via a Google Apps Script web app, and the
page is served as a static site from GitHub Pages.

```
index.html            the poll (edit API_URL near the top of the <script>)
apps-script/Code.gs    the backend — paste into script.google.com
```

## 1. Set up the backend (Google Apps Script + Sheet)

1. Go to <https://sheets.new> to make a new Google Sheet. Name it e.g.
   "Winter trip votes".
2. **Extensions → Apps Script**. Delete whatever is in `Code.gs` and paste
   the full contents of [`apps-script/Code.gs`](apps-script/Code.gs). Save
   (⌘S).
3. **Deploy → New deployment**. Click the gear next to "Select type" and
   choose **Web app**. Set:
   - **Description:** winter trip poll
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**, then **Authorize access** and allow the permissions
   (it only touches this one spreadsheet). Google may warn the app is
   "unverified" — click **Advanced → Go to (project name)**.
5. Copy the **Web app URL**. It ends in `/exec`, like
   `https://script.google.com/macros/s/AKfycb...../exec`.

Quick test: paste that URL into a browser tab. You should see
`{"ok":true,"votes":[]}`.

> If you later edit `Code.gs`, you must **Deploy → Manage deployments → edit
> (pencil) → Version: New version → Deploy** for the change to go live.

## 2. Wire the poll to the backend

Open [`index.html`](index.html), find this line near the top of the
`<script>` block, and paste your URL in:

```js
const API_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
```

Commit the change.

## 3. Put it on GitHub + turn on Pages

```bash
cd ~/Documents/winter-trip-poll
git add -A
git commit -m "Wire poll to Apps Script backend"

# create the repo on GitHub (needs the gh CLI, or make it in the web UI)
gh repo create winter-trip-poll --public --source=. --remote=origin --push
```

No `gh`? Create an empty repo at <https://github.com/new>, then:

```bash
git remote add origin https://github.com/<your-username>/winter-trip-poll.git
git branch -M main
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source:
"Deploy from a branch" → Branch: `main` / `/ (root)` → Save.** After a
minute your poll is live at:

```
https://<your-username>.github.io/winter-trip-poll/
```

Send that link to your friends.

## How voting works

- A friend enters their name, taps up to 3 destination cards in preference
  order, and hits **Submit vote**.
- Submitting again with the same name **replaces** their previous vote
  (name match is case-insensitive).
- **Clear my vote** deletes their row.
- Results unlock only after someone has voted. They're **rank-weighted**:
  1st pick = 3 pts, 2nd = 2, 3rd = 1.

## Round 2 — the finalist runoff (`round2.html`)

`round2.html` is a second, independent vote over the 5 top finishers from
round 1. Same mechanic (rank a top 3, 3/2/1 scoring). Its votes go to a
separate **`Round2`** tab in the same Google Sheet — round 1 is untouched.

**This needs the updated `Code.gs`.** After pasting the new
`apps-script/Code.gs`, redeploy: **Deploy → Manage deployments → ✏️ →
Version: New version → Deploy** (a plain Save does nothing). The old code
ignores the `round` parameter and would file round-2 votes into round 1.

Live at `https://<your-username>.github.io/winter-trip-poll/round2.html`.

## Viewing / managing responses

Open the Google Sheet. Each row is one voter: `name`, `picks` (JSON array
of destination ids, best first), `updated` (timestamp). Destination ids are
defined in `index.html` (`id:` field of each entry in `DESTINATIONS` /
`BONUS`) — e.g. `pv` = Puerto Vallarta, `cdmx` = Mexico City, `oahu` =
Honolulu.

## Notes / limitations

- The Apps Script URL is public and unauthenticated — anyone with it can
  read and write votes. That's fine for a friends' trip poll; don't reuse
  it for anything sensitive.
- Names are the identity. Two friends with the same first name will
  overwrite each other — have them add a last initial.
- Apps Script free quota is far more than a friend group will ever hit.
