# Knowledge-Panel JSON-LD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `freakpointing.ie`'s structured data to maximally cover Google-documented rich-result types (`Organization`/`Logo`, `WebSite`, `VideoObject`, `Review`, `FAQPage`) while continuing to enrich `MusicGroup`/`MusicAlbum` for Knowledge Graph ingestion.

**Architecture:** Per-entity JSON-LD includes under `_includes/jsonld/`, each rendered from the visible section it describes, cross-referenced via `@id`. Continues the pattern set up in the previous session (`band.html`, `releases.html`, `events.html`).

**Tech Stack:** Jekyll 4 + jekyll-seo-tag plugin · vanilla HTML/CSS/JS · YAML data files (`_data/`). No build tools beyond `bundle exec jekyll build`. No JS test framework — verification is build-and-grep against `_site/index.html`.

**Spec:** [`docs/specs/2026-04-29-knowledge-panel-jsonld-design.md`](../specs/2026-04-29-knowledge-panel-jsonld-design.md)

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `_config.yml` | modify | Split YAML anchor: `_banner` for OpenGraph image, new `_logo` for Organization logo |
| `_data/site_meta.yml` | modify | Add `band.email` |
| `_data/lineup.yml` | modify | Add `founder: true` to founding members |
| `_data/releases.yml` | modify | Add `jsonld.review_ids` to too-tall-to-see-the-moon |
| `_data/videos.yml` | **create** | Video metadata (one entry per video) |
| `_data/reviews.yml` | **create** | Review metadata (one entry per press review) |
| `_data/faqs.yml` | **create** | FAQ Q&A pairs |
| `_includes/jsonld/band.html` | modify | Enrich MusicGroup: logo, slogan, email, founder[], album[], track[], Person @id |
| `_includes/jsonld/releases.html` | modify | Emit `review[]` cross-ref when `jsonld.review_ids` present |
| `_includes/jsonld/website.html` | **create** | WebSite JSON-LD with publisher cross-ref |
| `_includes/jsonld/videos.html` | **create** | VideoObject[] JSON-LD |
| `_includes/jsonld/reviews.html` | **create** | Review[] JSON-LD |
| `_includes/jsonld/faq.html` | **create** | FAQPage JSON-LD |
| `_includes/faq.html` | **create** | Visible FAQ section (`<details>` accordion) |
| `_layouts/default.html` | modify | Include `jsonld/website.html` in `<head>` |
| `_includes/video.html` | modify | Include `jsonld/videos.html` |
| `_includes/press.html` | modify | Include `jsonld/reviews.html` |
| `index.html` | modify | Insert `{% include faq.html %}` between gigs and contact |
| `style.css` | modify | Add ~20 lines for FAQ section |
| `bin/jsonld-extract.py` | **create** | Helper script: extract & pretty-print JSON-LD blocks from built HTML (used for verification) |

---

## Boilerplate Build Command

The user's machine has rbenv installed but not on the non-interactive shell PATH (system Ruby 2.6 wins by default and can't run Jekyll). Every `bundle`/`jekyll` invocation in this plan uses:

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build
```

Site output lands in `_site/` (gitignored). The home page rendered HTML is `_site/index.html`.

---

## Task 1: Foundation — config, data file additions, and verification helper

**Files:**
- Modify: `_config.yml` (lines 1, 22)
- Modify: `_data/site_meta.yml` (add `email` under `band:`)
- Modify: `_data/lineup.yml` (add `founder: true` to two entries)
- Create: `bin/jsonld-extract.py`

This task lays the data foundations every later task depends on, plus a small Python helper that extracts and pretty-prints all JSON-LD blocks from a built `index.html`. The helper is the verification "test runner" for the plan — every later task uses it.

- [ ] **Step 1: Create `bin/jsonld-extract.py`**

Create the file with this exact content:

```python
#!/usr/bin/env python3
"""Extract and pretty-print all JSON-LD blocks from a Jekyll-built HTML page.

Usage:
    python3 bin/jsonld-extract.py [path/to/file.html]

Defaults to _site/index.html.
"""
import json
import re
import sys
from pathlib import Path

DEFAULT_PATH = Path("_site/index.html")


def extract(html: str) -> list[dict]:
    blocks = re.findall(
        r'<script type="application/ld\+json">(.*?)</script>',
        html,
        re.DOTALL,
    )
    return [json.loads(b) for b in blocks]


def main() -> int:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PATH
    if not path.exists():
        print(f"ERROR: {path} not found. Run bundle exec jekyll build first.")
        return 1
    blocks = extract(path.read_text())
    print(f"Found {len(blocks)} JSON-LD block(s) in {path}\n")
    for i, b in enumerate(blocks):
        kind = b.get("@type", "?")
        ident = b.get("@id", "(no @id)")
        print(f"--- Block {i + 1}: @type={kind} @id={ident} ---")
        print(json.dumps(b, indent=2))
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

Make it executable:

```bash
chmod +x bin/jsonld-extract.py
```

- [ ] **Step 2: Run a baseline build to verify the helper works**

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build && python3 bin/jsonld-extract.py
```

Expected: prints "Found N JSON-LD block(s)" where N is at least 3 (existing band, releases, events plus the seo-tag's WebSite/Person). Each block is pretty-printed. No errors.

If `bundle exec jekyll build` fails, do NOT proceed — diagnose Ruby/bundler issues first. The `~/.rbenv/shims` PATH prefix is mandatory.

- [ ] **Step 3: Modify `_config.yml` to split the logo from the banner**

Currently `_config.yml` line 1 defines a YAML anchor `_banner: &banner /assets/spotify_banner.jpg` that's reused as `logo: *banner` on line 22. The banner is 2660×1140 (wide) — wrong for an `Organization.logo`. Add a separate logo anchor.

Replace lines 1–2:

```yaml
_banner: &banner /assets/spotify_banner.jpg
_brand: &brand Freak Pointing
```

with:

```yaml
_banner: &banner /assets/spotify_banner.jpg
_logo:   &logo   /assets/FreakPointing_Logo.png
_brand: &brand Freak Pointing
```

And replace line 22 (`logo: *banner`) with:

```yaml
logo: *logo
```

The OpenGraph image (`defaults.image.path` further down) keeps using `*banner` — that's correct for social-share previews.

- [ ] **Step 4: Add `email` to `_data/site_meta.yml`**

Modify the `band:` block. Insert `email: lads@freakpointing.ie` after the `tagline:` line (line 7), so the top of the file becomes:

```yaml
band:
  name: Freak Pointing
  legal_name: Freak Pointing
  short_description: Four-piece Dublin rock band. Hard riffs, melodic anthems, punk energy.
  long_description: A Dublin-based, four-piece rock band. Hard riffs, melodic anthems, punk energy.
  hero_meta_description: Freak Pointing are a four-piece Dublin rock band. Hard riffs, melodic anthems, punk energy.
  tagline: "Dublin rock. Hard riffs. No filler."
  email: lads@freakpointing.ie
```

- [ ] **Step 5: Add `founder: true` to founding members in `_data/lineup.yml`**

Modify lines 9–18 (the Fearghal and Darryn entries). The two members with `start_date: "2020-08"` are the founders. Final state of those two entries:

```yaml
- name: Fearghal Traynor
  role: Vocals
  jsonld_role: Vocalist
  start_date: "2020-08"
  founder: true
- name: Darryn Downey
  role: "Lead & Rhythm Guitars"
  jsonld_role:
    - Lead Guitar
    - Rhythm Guitar
  start_date: "2020-08"
  founder: true
```

The Daragh and Stephen entries are unchanged (no `founder:` field).

- [ ] **Step 6: Rebuild and verify nothing broke**

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build && python3 bin/jsonld-extract.py | head -40
```

Expected: build succeeds. The `MusicGroup` block still validates (the data changes don't affect band.html yet — that's Task 2). No new JSON-LD blocks. The `seo-tag`-emitted `Organization` (or whatever it emits via `site.logo`) now references `/assets/FreakPointing_Logo.png` instead of the banner. Quick check:

```bash
grep -c 'FreakPointing_Logo.png' _site/index.html
```

Expected: ≥ 1 (was 0 before — the {% seo %} JSON-LD now picks up the corrected logo path).

- [ ] **Step 7: Commit**

```bash
git add bin/jsonld-extract.py _config.yml _data/site_meta.yml _data/lineup.yml
git commit -m "chore: data foundations for knowledge-panel jsonld

- split _logo anchor from _banner in _config.yml so site.logo
  references the actual logo (not the wide banner)
- add band.email to site_meta.yml
- mark Fearghal and Darryn as founder: true in lineup.yml
- add bin/jsonld-extract.py helper for verifying built JSON-LD"
```

---

## Task 2: Enrich `band.html` with logo, slogan, email, and Person @ids

**Files:**
- Modify: `_includes/jsonld/band.html`

Adds three flat properties (`logo`, `slogan`, `email`) and gives every `Person` inside `member[]` a stable `@id` so subsequent tasks can cross-reference them.

- [ ] **Step 1: Define the verification check (will fail now)**

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build
python3 -c "
import json
from bin import jsonld_extract  # noqa
" 2>&1 | head -1
```

Skip the import dance — just run the extract directly:

```bash
python3 bin/jsonld-extract.py | grep -E '(\"slogan\"|\"email\"|\"logo\")' | head -10
```

Expected: only the `logo` line appears (from the seo-tag's existing JSON-LD block, fixed in Task 1). No `slogan` or `email` lines yet.

- [ ] **Step 2: Modify `_includes/jsonld/band.html`**

Open `_includes/jsonld/band.html`. Replace its entire contents with:

```liquid
{%- comment -%}
  Schema.org MusicGroup, modelled on the canonical Beatles example
  (https://schema.org/MusicGroup) but rendered from:
    - site.data.site_meta.band  (name, descriptions, founding_*, genres, tagline, email)
    - site.data.lineup           (member[] with OrganizationRole; founder: true marks founding members)
    - site.data.releases         (album[] cross-refs to MusicAlbum @ids; track[] cross-refs to top released singles)
    - site.social.links          (sameAs[] — single source of truth in _config.yml)
    - site.logo                  (Organization.logo — separate from image)
    - site.url                    (URL + @id base)
{%- endcomment -%}
{%- assign band = site.data.site_meta.band -%}
{%- assign hero_logo = band.hero_logo -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MusicGroup",
  "@id": {{ site.url | append: "/#band" | jsonify }},
  "name": {{ band.name | jsonify }},
  "description": {{ band.long_description | jsonify }},
  "slogan": {{ band.tagline | jsonify }},
  "email": {{ band.email | jsonify }},
  "url": {{ site.url | jsonify }},
  "image": {{ site.url | append: band.banner_image.url | jsonify }},
  "logo": {
    "@type": "ImageObject",
    "url": {{ site.url | append: site.logo | jsonify }},
    "width": {{ hero_logo.width }},
    "height": {{ hero_logo.height }}
  },
  "sameAs": {{ site.social.links | jsonify }},
  "foundingLocation": {
    "@type": {{ band.founding_location.type | jsonify }},
    "name": {{ band.founding_location.name | jsonify }}
  },
  "foundingDate": {{ band.founding_date | jsonify }},
  "genre": {{ band.genres | jsonify }},
  "member": [
    {%- for m in site.data.lineup -%}
    {%- assign person_id = m.name | slugify | prepend: "/#person-" | prepend: site.url -%}
    {
      "@type": "OrganizationRole",
      "member": {
        "@type": "Person",
        "@id": {{ person_id | jsonify }},
        "name": {{ m.name | jsonify }}
      },
      "startDate": {{ m.start_date | jsonify }}{%- if m.end_date -%},
      "endDate": {{ m.end_date | jsonify }}{%- endif -%},
      "roleName": {{ m.jsonld_role | jsonify }}
    }{%- unless forloop.last -%},{%- endunless -%}
    {%- endfor %}
  ]
}
</script>
```

Compared to the existing file: same structure, with three additions (`slogan`, `email`, `logo` ImageObject) and the `Person` inside `member` now has an `@id`.

- [ ] **Step 3: Rebuild and verify**

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build
python3 bin/jsonld-extract.py | grep -E '(\"slogan\"|\"email\"|\"@id\": \"https://freakpointing.ie/#person-)' | head -10
```

Expected output (order may vary):

```
  "slogan": "Dublin rock. Hard riffs. No filler.",
  "email": "lads@freakpointing.ie",
        "@id": "https://freakpointing.ie/#person-fearghal-traynor",
        "@id": "https://freakpointing.ie/#person-darryn-downey",
        "@id": "https://freakpointing.ie/#person-daragh-cosgrove",
        "@id": "https://freakpointing.ie/#person-stephen-coogan",
```

Also confirm the logo node exists and points at the PNG:

```bash
python3 bin/jsonld-extract.py | grep -A 4 '"logo": {'
```

Expected: an `ImageObject` with `url` ending in `FreakPointing_Logo.png` and `width: 2507`, `height: 1140`.

- [ ] **Step 4: Commit**

```bash
git add _includes/jsonld/band.html
git commit -m "feat: add logo, slogan, email, and Person @ids to MusicGroup jsonld"
```

---

## Task 3: Add `founder[]` to `band.html`

**Files:**
- Modify: `_includes/jsonld/band.html`

Cross-references the founding members (added via `founder: true` in Task 1) by their Person `@id` (added in Task 2).

- [ ] **Step 1: Verify founder[] is missing**

```bash
python3 bin/jsonld-extract.py | grep '"founder"'
```

Expected: no output (no `founder[]` field yet).

- [ ] **Step 2: Add the `founder[]` block**

In `_includes/jsonld/band.html`, find the closing `}` of the `genre:` line (the line that reads `"genre": {{ band.genres | jsonify }},`) and insert the following Liquid block immediately after it (and before the `"member": [` line):

```liquid
  {%- assign founders = site.data.lineup | where: "founder", true -%}
  {%- if founders.size > 0 -%}
  "founder": [
    {%- for f in founders -%}
    {%- assign fid = f.name | slugify | prepend: "/#person-" | prepend: site.url -%}
    { "@id": {{ fid | jsonify }} }{%- unless forloop.last -%},{%- endunless -%}
    {%- endfor %}
  ],
  {%- endif %}
```

The block emits a `founder[]` array of `@id` references; the trailing comma is inside the `if` so the JSON stays valid when no founders are flagged.

- [ ] **Step 3: Rebuild and verify**

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build
python3 bin/jsonld-extract.py | python3 -c "
import json, sys, re
text = sys.stdin.read()
blocks = re.split(r'--- Block \d+:', text)
mg = next(b for b in blocks if 'MusicGroup' in b)
start = mg.index('{')
obj = json.loads(mg[start:].strip())
assert 'founder' in obj, 'founder[] missing'
assert len(obj['founder']) == 2, f\"expected 2 founders, got {len(obj['founder'])}\"
ids = [f['@id'] for f in obj['founder']]
assert any('fearghal' in i for i in ids), 'Fearghal not in founders'
assert any('darryn' in i for i in ids), 'Darryn not in founders'
print('OK: founder[] has 2 entries (Fearghal, Darryn)')
"
```

Expected output: `OK: founder[] has 2 entries (Fearghal, Darryn)`.

- [ ] **Step 4: Commit**

```bash
git add _includes/jsonld/band.html
git commit -m "feat: add founder[] cross-refs to MusicGroup jsonld"
```

---

## Task 4: Add `album[]` to `band.html`

**Files:**
- Modify: `_includes/jsonld/band.html`

Cross-references every release that has a `jsonld:` block in `_data/releases.yml` (matching what `_includes/jsonld/releases.html` already emits — currently 4 visible + 1 hidden = 5 albums).

- [ ] **Step 1: Verify album[] is missing**

```bash
python3 bin/jsonld-extract.py | grep '"album"'
```

Expected: no output.

- [ ] **Step 2: Add the `album[]` block**

In `_includes/jsonld/band.html`, immediately after the closing `]` and `,` of the `founder[]` block (or, if `founder[]` is absent, after the `genre:` line), insert:

```liquid
  {%- assign jsonld_releases = site.data.releases | where_exp: "r", "r.jsonld" -%}
  {%- if jsonld_releases.size > 0 -%}
  "album": [
    {%- for r in jsonld_releases -%}
    {%- assign rid = r.id | prepend: "/#release-" | prepend: site.url -%}
    { "@id": {{ rid | jsonify }} }{%- unless forloop.last -%},{%- endunless -%}
    {%- endfor %}
  ],
  {%- endif %}
```

Filter is `where_exp: "r", "r.jsonld"` — same as `_includes/jsonld/releases.html` uses on line 15. This guarantees every emitted MusicAlbum @id is referenced.

- [ ] **Step 3: Rebuild and verify**

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build
python3 bin/jsonld-extract.py | python3 -c "
import json, sys, re
text = sys.stdin.read()
blocks = re.split(r'--- Block \d+:', text)
mg = next(b for b in blocks if 'MusicGroup' in b)
obj = json.loads(mg[mg.index('{'):].strip())
album_ids = [a['@id'] for a in obj['album']]
expected = {
    'https://freakpointing.ie/#release-too-tall-to-see-the-moon',
    'https://freakpointing.ie/#release-the-circle-beneath',
    'https://freakpointing.ie/#release-stuck',
    'https://freakpointing.ie/#release-vainglorious',
    'https://freakpointing.ie/#release-joke',
}
assert set(album_ids) == expected, f'mismatch: got {set(album_ids)}'
print(f'OK: album[] has {len(album_ids)} entries, all expected')
"
```

Expected: `OK: album[] has 5 entries, all expected`.

- [ ] **Step 4: Commit**

```bash
git add _includes/jsonld/band.html
git commit -m "feat: add album[] cross-refs to MusicGroup jsonld"
```

---

## Task 5: Add `track[]` to `band.html`

**Files:**
- Modify: `_includes/jsonld/band.html`

Cross-references the band's released, non-hidden singles by their `MusicRecording` `@id`. The `@id` pattern comes from `_includes/jsonld/releases.html` line 51, which slugifies the track name to build `{site.url}/#track-{slug}`.

Currently: The Circle Beneath, Stuck, Vainglorious. Auto-updates when new singles release.

- [ ] **Step 1: Verify track[] is missing**

```bash
python3 bin/jsonld-extract.py | python3 -c "
import json, sys, re
text = sys.stdin.read()
blocks = re.split(r'--- Block \d+:', text)
mg = next(b for b in blocks if 'MusicGroup' in b)
obj = json.loads(mg[mg.index('{'):].strip())
print('track' in obj)
"
```

Expected: `False`.

- [ ] **Step 2: Add the `track[]` block**

In `_includes/jsonld/band.html`, immediately after the closing `]` and `,` of the `album[]` block, insert:

```liquid
  {%- assign top_singles = site.data.releases
        | where: "type_label", "Single"
        | where: "status", "released"
        | where_exp: "r", "r.hidden != true" -%}
  {%- if top_singles.size > 0 -%}
  "track": [
    {%- for r in top_singles -%}
    {%- comment -%}
      Each released single's first (and typically only) track. The track @id
      pattern matches what _includes/jsonld/releases.html line 51 emits.
    {%- endcomment -%}
    {%- assign track_name = r.tracks | first -%}
    {%- assign tid = track_name | slugify | prepend: "/#track-" | prepend: site.url -%}
    { "@id": {{ tid | jsonify }} }{%- unless forloop.last -%},{%- endunless -%}
    {%- endfor %}
  ],
  {%- endif %}
```

- [ ] **Step 3: Rebuild and verify**

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build
python3 bin/jsonld-extract.py | python3 -c "
import json, sys, re
text = sys.stdin.read()
blocks = re.split(r'--- Block \d+:', text)
mg = next(b for b in blocks if 'MusicGroup' in b)
obj = json.loads(mg[mg.index('{'):].strip())
track_ids = [t['@id'] for t in obj['track']]
expected = {
    'https://freakpointing.ie/#track-the-circle-beneath',
    'https://freakpointing.ie/#track-stuck',
    'https://freakpointing.ie/#track-vainglorious',
}
assert set(track_ids) == expected, f'mismatch: got {set(track_ids)}'
print(f'OK: track[] has {len(track_ids)} entries, matches released non-hidden singles')
"
```

Expected: `OK: track[] has 3 entries, matches released non-hidden singles`.

Also verify each track @id resolves to a real MusicRecording emitted by `releases.html`:

```bash
python3 bin/jsonld-extract.py | grep -E '#track-(the-circle-beneath|stuck|vainglorious)' | sort -u | wc -l
```

Expected: `6` (3 emitted in releases.html `MusicRecording` nodes + 3 referenced in band.html `track[]`).

- [ ] **Step 4: Commit**

```bash
git add _includes/jsonld/band.html
git commit -m "feat: add track[] cross-refs to MusicGroup jsonld

Auto-derived from released, non-hidden singles in _data/releases.yml.
Currently The Circle Beneath, Stuck, Vainglorious."
```

---

## Task 6: Reviews — data, JSON-LD include, and EP cross-ref

**Files:**
- Create: `_data/reviews.yml`
- Create: `_includes/jsonld/reviews.html`
- Modify: `_includes/press.html` (add include line)
- Modify: `_includes/jsonld/releases.html` (emit `review[]` from `jsonld.review_ids`)
- Modify: `_data/releases.yml` (add `review_ids:` to too-tall-to-see-the-moon)

- [ ] **Step 1: Create `_data/reviews.yml`**

```yaml
# Press reviews. Each entry emits one Review JSON-LD node via
# _includes/jsonld/reviews.html, cross-referenced from the reviewed release's
# MusicAlbum node via jsonld.review_ids: in _data/releases.yml.
#
# `body` matches the visible quote in _includes/press.html (HTML entities
# resolved to Unicode; JSON-LD strings can't contain HTML).
#
# Pre-deploy: replace TODO date_published with the real publication date.
- id: into-d-groove
  reviewer:
    name: Dorn Simon
  publisher:
    name: Into d'Groove
  rating: 9
  best_rating: 10
  date_published: "TODO"  # YYYY-MM-DD — replace before deploying
  reviewed_release: too-tall-to-see-the-moon
  body: |
    Halfway through the first track I was already hooked. Fresh, loud,
    crisp in its delivery — these guys have delivered not only a
    listenable release, but a highly enjoyable one.
```

- [ ] **Step 2: Create `_includes/jsonld/reviews.html`**

```liquid
{%- comment -%}
  Schema.org Review[] — one node per entry in _data/reviews.yml. Each cross-
  references the reviewed release's MusicAlbum @id (matching the pattern in
  _includes/jsonld/releases.html). Rendered from _includes/press.html.

  Google review-snippet eligibility requires the reviewed content to be visible
  on the same page; press.html renders the visible quote, satisfying this.
{%- endcomment -%}
{%- for rev in site.data.reviews -%}
{%- assign release_id = rev.reviewed_release | prepend: "/#release-" | prepend: site.url -%}
{%- assign review_id = rev.id | prepend: "/#review-" | prepend: site.url -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Review",
  "@id": {{ review_id | jsonify }},
  "itemReviewed": { "@id": {{ release_id | jsonify }} },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": {{ rev.rating | jsonify }},
    "bestRating": {{ rev.best_rating | jsonify }}
  },
  "author": {
    "@type": "Person",
    "name": {{ rev.reviewer.name | jsonify }}
  },
  "publisher": {
    "@type": "Organization",
    "name": {{ rev.publisher.name | jsonify }}
  },
  "reviewBody": {{ rev.body | strip | jsonify }},
  "datePublished": {{ rev.date_published | jsonify }}
}
</script>
{% endfor -%}
```

- [ ] **Step 3: Wire `reviews.html` into `press.html`**

Open `_includes/press.html`. After the closing `</section>` tag (line 22), append:

```liquid
{% include jsonld/reviews.html %}
```

- [ ] **Step 4: Build and verify the Review block**

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build
python3 bin/jsonld-extract.py | grep -A 25 '"@type": "Review"'
```

Expected: a Review block with `ratingValue: "9"`, `bestRating: "10"`, `author.name: "Dorn Simon"`, `publisher.name: "Into d'Groove"`, `itemReviewed.@id: https://freakpointing.ie/#release-too-tall-to-see-the-moon`, `datePublished: "TODO"`.

The `"TODO"` is intentional — it's a pre-deploy placeholder per the spec.

- [ ] **Step 5: Add `review_ids` to the EP in `_data/releases.yml`**

In `_data/releases.yml`, find the `too-tall-to-see-the-moon` entry's `jsonld:` block (around lines 30–44). Add `review_ids:` to it. Final state of that `jsonld:` block:

```yaml
  jsonld:
    schema_type: MusicAlbum
    release_type: https://schema.org/EPRelease
    production_type: https://schema.org/StudioAlbum
    image_url: https://freakpointing.ie/assets/Too_Tall_To_See_The_Moon_EP_Artwork.webp
    review_ids:
      - into-d-groove
    # `numTracks` and `track` ItemList both auto-derive from the `tracks:` list above.
    # `same_as` is the verbatim sameAs list — list each platform URL explicitly.
    # TODO: add Apple Music album URL once published (2026-05-22). Pre-release
    # content isn't indexed by the iTunes Search API, so the public URL
    # `https://music.apple.com/ie/album/<slug>/<numeric-id>` won't be
    # discoverable via `https://itunes.apple.com/lookup?id=1798274194&entity=album`
    # until the EP goes live. The artists.apple.com AMI identifier
    # (ami:release:5d0dd75bac5284dc36858d2841eb132b) is internal-only.
    same_as:
      - https://freakpointing.bandcamp.com/album/too-tall-to-see-the-moon
```

- [ ] **Step 6: Modify `_includes/jsonld/releases.html` to emit `review[]` when present**

Find the existing `track`/`numTracks` block (lines 43–58 of the current file). Insert a new conditional `review[]` block immediately after the closing `}` of the `MusicAlbum` (i.e. just before the literal `}\n</script>` that closes each per-release loop iteration).

The change: between the line that reads `{%- endif %}` (closing the track/numTracks block) and the line that reads `}`, insert:

```liquid
  {%- if r.jsonld.review_ids -%}
  ,
  "review": [
    {%- for rid in r.jsonld.review_ids -%}
    {%- assign full_rid = rid | prepend: "/#review-" | prepend: site.url -%}
    { "@id": {{ full_rid | jsonify }} }{%- unless forloop.last -%},{%- endunless -%}
    {%- endfor %}
  ]
  {%- endif %}
```

The leading `,` is on its own line (matching the style of the existing `track`/`numTracks` block above it).

- [ ] **Step 7: Build and verify the cross-ref lands on the EP MusicAlbum**

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build
python3 bin/jsonld-extract.py | python3 -c "
import json, sys, re
text = sys.stdin.read()
blocks = re.split(r'--- Block \d+:', text)
ep = next(b for b in blocks if '#release-too-tall-to-see-the-moon' in b and 'MusicAlbum' in b)
obj = json.loads(ep[ep.index('{'):].strip())
assert 'review' in obj, 'review[] missing on EP MusicAlbum'
assert obj['review'][0]['@id'] == 'https://freakpointing.ie/#review-into-d-groove'
print('OK: EP MusicAlbum has review[] cross-ref to into-d-groove')
"
```

Expected: `OK: EP MusicAlbum has review[] cross-ref to into-d-groove`.

- [ ] **Step 8: Commit**

```bash
git add _data/reviews.yml _data/releases.yml _includes/jsonld/reviews.html _includes/jsonld/releases.html _includes/press.html
git commit -m "feat: add Review jsonld for Into d'Groove press quote

- new _data/reviews.yml (one entry; date_published is a pre-deploy TODO)
- new _includes/jsonld/reviews.html, included from press.html
- _includes/jsonld/releases.html emits review[] when jsonld.review_ids set
- EP too-tall-to-see-the-moon now cross-refs the review"
```

---

## Task 7: Videos — data and JSON-LD include

**Files:**
- Create: `_data/videos.yml`
- Create: `_includes/jsonld/videos.html`
- Modify: `_includes/video.html` (add include line)

- [ ] **Step 1: Create `_data/videos.yml`**

```yaml
# Video metadata for VideoObject JSON-LD via _includes/jsonld/videos.html.
# Required by Google rich-result eligibility: name, description, thumbnailUrl, uploadDate.
#
# `hosting: self` → contentUrl + thumbnailUrl from explicit fields below.
# `hosting: youtube` → all URLs derived from `youtube_id` in the template.
#
# Pre-deploy: replace all "TODO" values with real strings/dates before pushing.
- id: thumbtacks-live
  name: "Thumb Tacks (Live)"
  description: "TODO — 1-sentence description"
  upload_date: "TODO"  # YYYY-MM-DD
  hosting: self
  content_url: /assets/videos/thumbtacks.mp4
  thumbnail_url: /assets/videos/thumbtacks-800.webp
  same_as:
    - https://www.instagram.com/freakpointingband/p/DWQ4JmijZU2/

- id: youtube-jqkvxvb9bbo
  name: "TODO video title"
  description: "TODO — 1-sentence description"
  upload_date: "TODO"  # YYYY-MM-DD
  hosting: youtube
  youtube_id: JQkVXvB9BBo
```

- [ ] **Step 2: Create `_includes/jsonld/videos.html`**

```liquid
{%- comment -%}
  Schema.org VideoObject[] — one node per entry in _data/videos.yml. Rendered
  from _includes/video.html. Each video cross-references the band MusicGroup
  via about.@id.

  hosting: self     → contentUrl/thumbnailUrl prefixed with site.url for absolute URLs.
  hosting: youtube  → contentUrl, thumbnailUrl, embedUrl all derived from youtube_id.
{%- endcomment -%}
{%- for v in site.data.videos -%}
{%- assign band_id = site.url | append: "/#band" -%}
{%- assign video_id = v.id | prepend: "/#video-" | prepend: site.url -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "@id": {{ video_id | jsonify }},
  "name": {{ v.name | jsonify }},
  "description": {{ v.description | jsonify }},
  "uploadDate": {{ v.upload_date | jsonify }},
  "about": { "@id": {{ band_id | jsonify }} },
  {%- if v.hosting == "youtube" -%}
  "embedUrl": {{ "https://www.youtube.com/embed/" | append: v.youtube_id | jsonify }},
  "contentUrl": {{ "https://www.youtube.com/watch?v=" | append: v.youtube_id | jsonify }},
  "thumbnailUrl": {{ "https://i.ytimg.com/vi/" | append: v.youtube_id | append: "/maxresdefault.jpg" | jsonify }}
  {%- else -%}
  "contentUrl": {{ site.url | append: v.content_url | jsonify }},
  "thumbnailUrl": {{ site.url | append: v.thumbnail_url | jsonify }}
  {%- endif -%}
  {%- if v.same_as -%}
  ,
  "sameAs": {{ v.same_as | jsonify }}
  {%- endif %}
}
</script>
{% endfor -%}
```

- [ ] **Step 3: Wire `videos.html` into `video.html`**

Open `_includes/video.html`. After the closing `</section>` tag (line 28), append:

```liquid
{% include jsonld/videos.html %}
```

- [ ] **Step 4: Build and verify both video blocks**

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build
python3 bin/jsonld-extract.py | grep -c '"@type": "VideoObject"'
```

Expected: `2`.

Inspect each one:

```bash
python3 bin/jsonld-extract.py | grep -B 1 -A 15 '"@type": "VideoObject"'
```

Expected: two `VideoObject` nodes. The self-hosted one references `assets/videos/thumbtacks.mp4` and the webp thumbnail with absolute URLs. The YouTube one has `embedUrl: https://www.youtube.com/embed/JQkVXvB9BBo` and `thumbnailUrl: https://i.ytimg.com/vi/JQkVXvB9BBo/maxresdefault.jpg`. Both have `about.@id: https://freakpointing.ie/#band`.

- [ ] **Step 5: Commit**

```bash
git add _data/videos.yml _includes/jsonld/videos.html _includes/video.html
git commit -m "feat: add VideoObject jsonld for thumbtacks live and youtube embed

Pre-deploy: replace TODO upload dates and descriptions in _data/videos.yml
before pushing."
```

---

## Task 8: WebSite JSON-LD

**Files:**
- Create: `_includes/jsonld/website.html`
- Modify: `_layouts/default.html` (add include in `<head>`)

The `jekyll-seo-tag` plugin already emits its own JSON-LD with some `WebSite`-ish info. Adding ours alongside is valid — JSON-LD parsers consume all script blocks. Ours has `@id`, `inLanguage`, and a `publisher` cross-ref to the band, which the seo-tag's auto-emission lacks.

- [ ] **Step 1: Create `_includes/jsonld/website.html`**

```liquid
{%- comment -%}
  Schema.org WebSite. Adds @id, language, and a publisher cross-ref to the
  MusicGroup. Coexists with jekyll-seo-tag's auto-emitted JSON-LD; both validate.
  Rendered from _layouts/default.html so it's always in <head>.
{%- endcomment -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": {{ site.url | append: "/#website" | jsonify }},
  "url": {{ site.url | jsonify }},
  "name": {{ site.social.name | jsonify }},
  "publisher": { "@id": {{ site.url | append: "/#band" | jsonify }} },
  "inLanguage": {{ site.lang | jsonify }}
}
</script>
```

- [ ] **Step 2: Wire it into the default layout**

Open `_layouts/default.html`. Immediately after the `{% include head-critical.html %}` line (line 20), insert:

```liquid
  {% include jsonld/website.html %}
```

- [ ] **Step 3: Build and verify**

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build
python3 bin/jsonld-extract.py | grep -B 1 -A 8 '"@id": "https://freakpointing.ie/#website"'
```

Expected: a WebSite block with `inLanguage: "en-IE"`, `name: "Freak Pointing"`, `publisher: { "@id": "https://freakpointing.ie/#band" }`.

- [ ] **Step 4: Commit**

```bash
git add _includes/jsonld/website.html _layouts/default.html
git commit -m "feat: add WebSite jsonld with publisher cross-ref to band"
```

---

## Task 9: FAQ — data, visible section, JSON-LD, and CSS

**Files:**
- Create: `_data/faqs.yml`
- Create: `_includes/faq.html`
- Create: `_includes/jsonld/faq.html`
- Modify: `index.html` (insert FAQ section between gigs and contact)
- Modify: `style.css` (~20 lines for the FAQ section)

The single largest task — adds both visible UI and structured data, plus styling.

- [ ] **Step 1: Create `_data/faqs.yml`**

```yaml
# FAQs for the homepage. Renders both visible HTML (_includes/faq.html) and
# JSON-LD (_includes/jsonld/faq.html) — Google's FAQPage rich-result rule
# requires the answer text to be present in the visible DOM.
#
# Plain-text answers only (or limited HTML: <a>, <em>, <strong>, <p>, <ul>,
# <ol>, <li>, <b>, <i>); answers run through Liquid's markdownify filter.
- question: "Where is Freak Pointing from?"
  answer: "Freak Pointing are a four-piece rock band from Dublin, Ireland, formed in 2020."

- question: "Who's in Freak Pointing?"
  answer: "Fearghal Traynor (vocals), Darryn Downey (guitar), Daragh Cosgrove (bass), and Stephen Coogan (drums)."

- question: "What kind of music does Freak Pointing play?"
  answer: "Rock — hard riffs, melodic anthems, punk energy. Influenced by hard rock and grunge."

- question: "Where can I listen to Freak Pointing?"
  answer: "Spotify, Apple Music, Bandcamp, and YouTube Music. Links are in the Listen section above."
```

- [ ] **Step 2: Create the visible `_includes/faq.html`**

```html
<!-- FAQ -->
<section id="faq">
  <div class="section-inner">
    <h2 class="section-label">FAQ</h2>
    <div class="faq-list">
      {%- for f in site.data.faqs %}
      <details class="faq-item">
        <summary>{{ f.question }}</summary>
        <div class="faq-answer">{{ f.answer | markdownify }}</div>
      </details>
      {%- endfor %}
    </div>
  </div>
</section>
```

- [ ] **Step 3: Create `_includes/jsonld/faq.html`**

```liquid
{%- comment -%}
  Schema.org FAQPage. Rendered from _includes/faq.html. The visible HTML
  contains the same Q/A text — Google's rule is that FAQ rich results require
  every answer to be in the rendered DOM. <details> elements are explicitly
  allowed (the answer is in the DOM regardless of open state).

  No cross-references — FAQPage is intentionally standalone per Google's spec.
{%- endcomment -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": {{ site.url | append: "/#faq" | jsonify }},
  "mainEntity": [
    {%- for f in site.data.faqs -%}
    {
      "@type": "Question",
      "name": {{ f.question | jsonify }},
      "acceptedAnswer": {
        "@type": "Answer",
        "text": {{ f.answer | jsonify }}
      }
    }{%- unless forloop.last -%},{%- endunless -%}
    {%- endfor %}
  ]
}
</script>
```

- [ ] **Step 4: Wire JSON-LD into the visible FAQ section**

Open `_includes/faq.html` (just created). After the closing `</section>` tag, append:

```liquid
{% include jsonld/faq.html %}
```

- [ ] **Step 5: Insert FAQ section into `index.html`**

Open `index.html`. Currently lines 6–13 are:

```liquid
{% include hero.html %}
{% include music.html %}
{% include about.html %}
{% include press.html %}
{% include video.html %}
{% include photos.html %}
{% include gigs.html %}
{% include contact.html %}
```

Insert one line between the gigs and contact includes, so the block becomes:

```liquid
{% include hero.html %}
{% include music.html %}
{% include about.html %}
{% include press.html %}
{% include video.html %}
{% include photos.html %}
{% include gigs.html %}
{% include faq.html %}
{% include contact.html %}
```

- [ ] **Step 6: Build and verify visible + JSON-LD both render**

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build
grep -c 'class="faq-item"' _site/index.html
```

Expected: `4` (one `<details>` per FAQ).

```bash
python3 bin/jsonld-extract.py | python3 -c "
import json, sys, re
text = sys.stdin.read()
blocks = re.split(r'--- Block \d+:', text)
faq = next(b for b in blocks if 'FAQPage' in b)
obj = json.loads(faq[faq.index('{'):].strip())
qs = [q['name'] for q in obj['mainEntity']]
expected_starts = ['Where is', \"Who's in\", 'What kind', 'Where can']
for got, exp in zip(qs, expected_starts):
    assert got.startswith(exp), f'{got!r} does not start with {exp!r}'
print(f'OK: FAQPage has {len(qs)} questions in expected order')
"
```

Expected: `OK: FAQPage has 4 questions in expected order`.

- [ ] **Step 7: Add FAQ styling to `style.css`**

Append to the end of `style.css`:

```css
/* ============================================================
   FAQ
   ============================================================ */
#faq .faq-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-top: 1px solid var(--grey-mid);
}

#faq .faq-item {
  border-bottom: 1px solid var(--grey-mid);
}

#faq .faq-item summary {
  list-style: none;
  cursor: pointer;
  padding: 1.25rem 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: 0.02em;
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: color 120ms ease;
}

#faq .faq-item summary::-webkit-details-marker { display: none; }

#faq .faq-item summary::after {
  content: "+";
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
  transition: transform 200ms ease;
}

#faq .faq-item[open] summary::after { transform: rotate(45deg); }

#faq .faq-item summary:hover { color: var(--accent); }

#faq .faq-answer {
  padding: 0 0 1.25rem 0;
  color: var(--grey);
  font-size: 1rem;
  line-height: 1.6;
}

#faq .faq-answer p { margin: 0; }
```

Variable names match those defined at the top of `style.css` (`--grey-mid`, `--white`, `--grey`, `--accent`, `--font-display`).

- [ ] **Step 8: Build and visually verify**

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll serve --port 4000 &
sleep 3
open http://localhost:4000/#faq
```

Manual checks:
- The FAQ section appears between the gigs and contact sections.
- Each question is collapsed by default with a `+` indicator.
- Clicking a question expands it; the `+` rotates to `×`-like (45°).
- Background pure black, text white, accent purple/pink on hover and `[open]`.
- No rounded corners.

Then stop the server (`kill %1` or Ctrl-C in the original terminal).

- [ ] **Step 9: Commit**

```bash
git add _data/faqs.yml _includes/faq.html _includes/jsonld/faq.html index.html style.css
git commit -m "feat: add visible FAQ section + FAQPage jsonld

4 evergreen Qs (origin, lineup, genre, where-to-listen). Visible HTML
uses <details> accordion (Google-allowed for FAQ rich-result eligibility).
Inserted between gigs and contact in homepage section order."
```

---

## Task 10: Validation pass

**Files:** none (verification only)

End-to-end validation against external tools, plus a final sanity check.

- [ ] **Step 1: Build and serve locally**

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build
```

Confirm no warnings:

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll build 2>&1 | grep -iE '(warn|error)' || echo "clean build"
```

Expected: `clean build`.

- [ ] **Step 2: Count and inventory all JSON-LD blocks**

```bash
python3 bin/jsonld-extract.py | grep -E '^--- Block '
```

Expected: ≥ 9 blocks. The exact set:
- 1 × seo-tag's auto-emitted JSON-LD (Person/Organization-ish)
- 1 × `WebSite` (`@id: /#website`)
- 1 × `MusicGroup` (`@id: /#band`)
- 5 × `MusicAlbum` (one per release with `jsonld:` block)
- 2 × `VideoObject` (`@id: /#video-thumbtacks-live`, `/#video-youtube-jqkvxvb9bbo`)
- 1 × `Review` (`@id: /#review-into-d-groove`)
- 1 × `FAQPage` (`@id: /#faq`)
- N × `MusicEvent` (runtime-injected from Bandsintown — only present when JS runs; absent in `_site/index.html` since this is build-time only)

Total at build time: 11 (since runtime events aren't in `_site/`).

- [ ] **Step 3: Validate every cross-ref resolves**

```bash
python3 -c "
import json, re
html = open('_site/index.html').read()
blocks = [json.loads(b) for b in re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>', html, re.DOTALL)]
defined = set()
referenced = set()
def walk(node):
    if isinstance(node, dict):
        if '@id' in node and len(node) == 1:
            referenced.add(node['@id'])
        elif '@id' in node:
            defined.add(node['@id'])
        for v in node.values():
            walk(v)
    elif isinstance(node, list):
        for v in node: walk(v)
for b in blocks: walk(b)
unresolved = referenced - defined
print(f'defined @ids: {len(defined)}')
print(f'referenced @ids: {len(referenced)}')
if unresolved:
    print('UNRESOLVED:')
    for u in sorted(unresolved): print(f'  - {u}')
else:
    print('OK: all cross-references resolve to defined @ids')
"
```

Expected: `OK: all cross-references resolve to defined @ids`.

If any unresolved appear, they are likely typos in `@id` strings — check the offending block's source include.

- [ ] **Step 4: Schema.org validator**

Push a temporary commit to a branch and use Cloudflare-tunneled local server, OR validate the production-equivalent rendered HTML directly. Easiest: paste the rendered HTML at https://validator.schema.org/.

```bash
cat _site/index.html | pbcopy
```

Then go to https://validator.schema.org/, click "Code Snippet", paste, and submit.

Expected: zero errors. Warnings about generic recommendations (e.g. "consider adding `image` to Person") are acceptable; errors are not.

If any errors:
- Mismatched `@id` (already checked in Step 3 — if you pass that, this should pass too).
- Invalid enum values (e.g. typo in `albumProductionType`).
- Missing required properties on any `Review` (the `TODO` placeholder for `datePublished` is fine for the validator — it's a string; deploy-time gating is the user's responsibility).

- [ ] **Step 5: Google Rich Results Test**

Go to https://search.google.com/test/rich-results, switch to "Code" mode, paste `_site/index.html`, and run.

Expected: detects at minimum `Logo`, `VideoObject`, `Review`, `FAQPage`, `Event` (events absent at build time — only visible after publish + indexing). The non-rich-result types (`MusicGroup`, `MusicAlbum`, `WebSite`) won't show as "rich results detected" but should appear in "Other items" with no errors.

- [ ] **Step 6: Lighthouse SEO audit**

If `lighthouse` is available globally:

```bash
export PATH="$HOME/.rbenv/shims:$PATH" && bundle exec jekyll serve --port 4000 &
sleep 3
npx lighthouse http://localhost:4000 --only-categories=seo --quiet --chrome-flags="--headless"
```

Expected: SEO score 100. Structured-data audit lists all the entities found.

Stop the server.

- [ ] **Step 7: Final commit (if any cleanup made)**

If Steps 4–6 surfaced any minor issues you fixed inline, commit them:

```bash
git status
git diff
git add -p
git commit -m "fix: jsonld cleanup from validator pass"
```

If everything passed without changes, no commit needed.

---

## Pre-deploy reminders

Before pushing to `main` (which triggers GitHub Pages deploy):

- [ ] Replace `TODO` `upload_date` and `description` for both videos in `_data/videos.yml`.
- [ ] Replace `TODO` `name` for the YouTube video in `_data/videos.yml`.
- [ ] Replace `TODO` `date_published` for the review in `_data/reviews.yml`.

Nothing in the markup gates on these — emit-with-TODO is a trade the user explicitly chose. The rebuild test scripts in Tasks 6 and 7 will still pass with `TODO` in place; the validator in Task 10 Step 4 will accept them as strings; only the deployed page would surface the bad data.

---

## Summary of changes

- **Files created (8):** `bin/jsonld-extract.py`, `_data/videos.yml`, `_data/reviews.yml`, `_data/faqs.yml`, `_includes/jsonld/website.html`, `_includes/jsonld/videos.html`, `_includes/jsonld/reviews.html`, `_includes/jsonld/faq.html`, `_includes/faq.html`
- **Files modified (8):** `_config.yml`, `_data/site_meta.yml`, `_data/lineup.yml`, `_data/releases.yml`, `_includes/jsonld/band.html`, `_includes/jsonld/releases.html`, `_includes/video.html`, `_includes/press.html`, `_layouts/default.html`, `index.html`, `style.css`
- **Commits expected:** 9 (one per feature task) + optional cleanup
- **Net JSON-LD nodes added:** 1 WebSite, 2 VideoObject, 1 Review, 1 FAQPage; plus enriched MusicGroup with 6 new properties and 4 Person `@id`s; plus `review[]` cross-ref on the EP MusicAlbum.
