# Digital Frame — Project Handover

Last updated: September 2026 · repo HEAD at the time of writing: `b9fd48c`

This document is the single source of context for continuing work on the
site. Read it fully before touching anything.

---

## 1. The project

**Digital Frame** is Tal Nisim's studio: strategy, UI/UX, web development,
branding, campaigns and business automation. The site is its storefront.
Hebrew, RTL, heavy GSAP animation. Visual reference: mdx.so — stay as close
to it as possible while keeping the business's own identity.

- **Repo:** https://github.com/Talnisim01/Digital-Frame (branch `main`)
- **Live (temporary):** https://digital-frame-two.vercel.app — a real domain
  comes later.
- **Owner:** Tal. Speaks Hebrew; technical terms in English.

---

## 2. How to work with Tal — read this first

These are stated preferences, not suggestions.

1. **Measure before changing.** Run Playwright, read the numbers, then act.
   Never assume a fix worked — verify it.
2. **Root cause, not symptom.** Find *why*, not just a workaround.
3. **Verify after every push:** fresh clone + `diff -rq` against the tested
   build.
4. **Screenshot comparisons use absolute pixel offsets**, never percentages
   of page height (any height change shifts the frame and fakes a
   regression). Always compare against a same-build noise floor.
5. **One focused change per round**, with a screenshot for approval.
6. **Ask before using connected tools** (Make, Vercel, GitHub connectors).
   They cost tokens. Phrase it: *"I need to check X in Make, may I?"*, and
   offer that Tal can do it himself. When he says he's busy, handle it.
7. **Accessibility must not change the site for ordinary visitors.**
   Invisible fixes (alt, headings, ARIA, keyboard) are welcome. Anything
   visual is opt-in only, through the panel.
8. Prefers doing things himself when it saves money.

---

## 3. Architecture

Static HTML. **No framework, no build step on Vercel.** A Python generator
produces the pages; its output is committed.

```
_src/
  build.py            generator — run: python3 _src/build.py
  images.py           image pipeline — run: python3 _src/images.py
  partials/           nav, menu, contact, footer (single source)
assets/
  site.css            base styles (hand-written, extracted from the original)
  pages.css           inner pages + every feature added since
  engine.js           GSAP / ScrollTrigger / Lenis animation engine
  site.js             behaviour: menu, form, player, WhatsApp, a11y panel
  consent.js          Consent Mode v2 — MUST load before GTM
  Work/               source images (archive, not served)
  work-web/           served WebP at 400/800/1600 + manifest.json
  brand/              logo sources
api/contact.js        Vercel serverless function for the contact form
index.html            home page — HAND-WRITTEN
vercel.json           cleanUrls, cache headers, /work → /projects redirect
```

### The home page is special

`index.html` is hand-written and pixel-tuned. The generator **does not
rebuild it** — it only replaces blocks between markers:

```
<!--@nav-->  <!--@menu-->  <!--@contact-->  <!--@footer-->
<!--@seo-->  <!--@wa-->    <!--@rlb-->      <!--@ico-->   <!--@a11y-->
```

Anything added to the shared shell in `build.py`'s `page()` function must
also get a marker in `index.html`, or the home page silently misses it.
This has caused real bugs — the home page lacked `<main>` and a skip link
until late in the project. Check the home page every time.

### Switches at the top of `build.py`

| Constant | Now | Purpose |
|---|---|---|
| `SITE` | `https://digital-frame-two.vercel.app` | canonical + sitemap base |
| `LIVE` | `False` | `False` = noindex everywhere, robots blocks all |
| `EXEMPT` | `True` | accessibility statement shows the exempt-dealer paragraph |
| `GTM_ID` | `GTM-K97TXLG5` | |
| `PIXEL_ID` | `1099984849149765` | loaded via GTM only, never hard-coded |
| `SOCIAL` | dict | 3 of 5 still `#` |

**Launch day:** set `SITE` to the real domain, `LIVE = True`, rebuild.
**Becoming a VAT-registered dealer:** `EXEMPT = False`, rebuild.

---

## 4. Critical technical lessons

Each of these was learned by breaking something.

- **`gsap.from()` animates toward the element's natural value.** CSS hides
  every `[data-animate]` before first paint, so the natural value is 0.
  Always use `fromTo` with explicit end values.
- **Every reveal branch must animate opacity.** `clip-in` didn't, and the
  whole showreel section sat invisible.
- **Reveal threshold is `top bottom-=8`.** Higher values leave content at the
  bottom of a fitting section hidden until the user scrolls further.
- **`lenis.stop()` blocks scrolling entirely** (adds `overflow:hidden`). To
  disable smoothing, set `lenis.options.smoothWheel = false` instead.
- **The site uses no `rem`.** All 134 font-size declarations are `px` or
  `clamp()` over `vw`. Changing the root font size scales nothing. Text
  enlargement uses `zoom` on `main` and `.foot`.
- **`filter` on an ancestor breaks `position:fixed` and GSAP pins.** Use a
  fixed overlay with `backdrop-filter` instead.
- **Class names on `<html>` must never equal element class names.** A mode
  class `a11y-gray` on `<html>` matched the rule `.a11y-gray` and set the
  whole document to `display:none` — nothing was clickable.
- **`focus()` on an element with `visibility:hidden` fails silently.** Wait
  for `transitionend`, with a timeout fallback.
- **`frame.src` returns the page URL when the attribute is empty.** Use
  `getAttribute('src')` to test for an unset iframe.
- **The magnet (Lenis `onEnter` scroll-to) hijacks programmatic scrolls.**
  A `navScroll` flag makes it stand down during deliberate navigation.
- **The CSS `transition` shorthand rewrites the whole list.** A dark-mode
  colour rule deleted the burger's `transform` transition.

### Testing environment

- The container network blocks the CDNs, Vimeo, Framer, Make and vercel.app.
  Test by copying the repo, installing `gsap@3.12.5` and
  `@studio-freight/lenis@1.0.42` via npm, rewriting CDN URLs to a local
  `/vendor/`, stripping Google Fonts, and serving with
  `python3 -m http.server`.
- Playwright: `/home/claude/.npm-global/lib/node_modules/playwright`, run with
  `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`.
- `window.scrollTo` fights Lenis. Use `window.lenis.scrollTo(y, {immediate:true})`,
  and stub `window.lenis.scrollTo` if the magnet interferes with a test.
- The craft section plays video, so its offset (~6400px) has high
  same-build noise (up to 6%). Confirm by measuring element positions.
- To test touch behaviour, use a real device profile
  (`devices['iPhone 13']`); a narrow viewport alone still reports a mouse.
- When isolating a feature's performance cost, trace the same interaction
  with it off and on and subtract. A trace on its own can mislead — one
  "zero paint" result was measuring a page that wasn't rendering at all.

### Git pitfalls

- **Never force-push from a shallow clone** (`--depth 1`) — it deletes the
  history on the server.
- **`cp -a src/. dest/` overwrites `dest/.git`.** Move trees with
  `tar --exclude='./.git'`.
- The history was rewritten so every commit is authored by
  `Tal Nisim <hello@digitalframe.co.il>`. Keep committing as that identity.

---

## 5. Current state

### Pages (31)

Home · `/services` + 10 service pages · `/projects` + 11 case studies ·
`/about-us` · `/contact` · `/thank-you` · `/privacy-policy` · `/terms` ·
`/accessibility` · `404`

### Contact form — working end to end

```
form → api/contact.js → Make webhook → Gmail ×2 → auto-reply → 200 → Sheet
```

- Webhook: `https://hook.us2.make.com/u60pcdsgw6jqbf2hvve93bwqhsrkw4aa`
- Make scenario `6334534`, team `2749947` (My Team), zone `us2.make.com`
- Google connection `11199806` (thedigitalframe1@gmail.com), used for both
  Gmail and Sheets
- Sheet: `1qqF6JwK_bhq-cKhDH5dNZsVv595Co0usZWcxwhstx54`, tab `Sheet1`
- Notifications go to `thedigitalframe1@gmail.com` and `talnisim01@gmail.com`
- The Sheet step is **last on purpose**: if it fails, the emails and the 200
  response have already gone out, so no enquiry is lost.
- Vercel env var `MAKE_WEBHOOK_URL` is set for Production. Without it the
  endpoint returns 503 and the form falls back to mailto.
- Success redirects to `/thank-you` with `location.replace`, so Back cannot
  resubmit. The redirect fires only on success.

### Tracking — Consent Mode v2, fully verified

- `consent.js` runs synchronously **before** GTM, defaulting all four
  signals to `denied`, with `wait_for_update:500`, `ads_data_redaction` and
  `url_passthrough`.
- Cookie banner: non-blocking, "necessary only" equal in prominence to
  "accept all", reopenable from the footer. Raises `--dock-offset`.
- The Meta Pixel tag in GTM uses Meta's official template, with
  **Require additional consent: `ad_storage`**. Published.
- Verified: default denied, tag not fired before consent, `fbevents.js` 200
  after accept, zero requests after "necessary only", PageView received in
  Meta Events Manager.
- Meta's "automatic page and product details" setting was **turned off** on
  purpose — it scraped form fields.
- Do not enable Conversions API without building a separate consent path;
  server-side events bypass browser consent.

### Accessibility

Built into the code: `lang`/`dir`, skip link, `<main>` on every page, keyboard
navigation with `inert` on closed menus and panels, visible focus rings,
heading hierarchy with zero skips across all pages, alt on every image, ARIA
labels.

Opt-in panel (bottom-left button), nine controls in three groups: text size,
readable font, text spacing · contrast, grayscale, highlight links, large
cursor · reading mask, stop motion. Saved in `localStorage` key
`df_a11y_v1`, applied by the inline head script before first paint.
Invisible to anyone who doesn't open it.

Stacking order, bottom to top: nav 50 · reading mask 55 · WhatsApp 60 ·
cookie banner 70 · grayscale layer 74 · a11y button 75 · a11y panel 78 ·
showreel player 90.

### Media

- Showreel: Vimeo `1227077566`, lazy background player plus a full-screen
  player layer controlled over `postMessage`. Pre-fullscreen window:
  `clip-path:inset(9.8% 3.3%)` — 93.4% × 80.4%, matching the reference.
- Project images: WebP via `_src/images.py`, served with `srcset`.
- Home hero frames: staged loading — every sixth frame first, the rest in
  the background, six requests at a time. The set is chosen by connection
  (`navigator.connection`), not screen width.

---

## 6. Open tasks

**Waiting on Tal:**
- 3 social URLs: LinkedIn, YouTube, TikTok (`SOCIAL` in `build.py`)
- 27 `⚠` placeholders in the legal pages (business details, tools used)
- Better project images: projects 1920×1200 (8:5), gallery 1200×1200.
  Drop into `assets/Work/`, then run `python3 _src/images.py`.
- All site copy: Hebrew text quality, reversed headings, the 11 case-study
  bodies (still placeholders), 3–4 real testimonials with name and role,
  and his photo for `/about-us` (brand speaks as "we", he appears as founder).

**Deferred by design:**
- **Base contrast.** `--gray` (#A3A6AA) on paper is 2.13:1 against the
  required 4.5:1. The standard is measured on the default site, so the
  panel does not fix this. Tal will fix it during the copy pass.
- **Organic SEO:** Schema (`LocalBusiness`, `Service`), unique meta
  descriptions, real service-page copy. Waits for the copy pass.

**Housekeeping:**
- A stash in Tal's local GitHub Desktop holds old local edits. Do not
  restore it — it predates the history rewrite.
- A pending, unused Make credential request (`google-restricted`) could not
  be deleted. Harmless.

---

## 7. Access for the new session

### GitHub token

Create a **fine-grained** personal access token:

- Resource owner: `Talnisim01`
- Repository access: **Only select repositories** → `Talnisim01/Digital-Frame`
- Permissions → Repository:
  - **Contents: Read and write** — the only one needed to push
  - Metadata: Read-only — added automatically
- **Nothing else.** No Actions, no Workflows — Vercel deploys from a
  webhook, not from GitHub Actions.
- Expiration: 30 days.

Paste it into the new chat. Do not store it in memory or in any file.
The previous token was exposed in chat and should be revoked.

### Push pattern

```bash
git clone https://github.com/Talnisim01/Digital-Frame.git build
# … work, build, test …
git -c user.email=hello@digitalframe.co.il -c user.name="Tal Nisim" commit -F msg.txt
git push "https://x-access-token:${GH_TOKEN}@github.com/Talnisim01/Digital-Frame.git" main
# then: fresh clone + diff -rq against the tested build
```

Commit messages are long-form: what, why, the root cause, and the numbers
that verified it.
