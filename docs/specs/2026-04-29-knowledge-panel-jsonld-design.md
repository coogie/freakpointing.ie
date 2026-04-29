# Knowledge-Panel JSON-LD — Design Spec

## Context

The Beatles' Google Knowledge Panel exposes ~15 distinct components — origin, founders, members, genres, album carousel, top tracks, reviews, videos, FAQs, social profiles, upcoming events, etc. We want to push freakpointing.ie's structured-data coverage as far toward that surface as is realistic for an indie band.

Reality check: **Google publishes no music-specific rich result.** Album/track carousels are Knowledge-Graph artifacts, not structured-data outputs — they only appear once Google independently classifies an entity as notable (Wikidata-tier). The realistic rich-result targets we *can* hit through markup alone are:

- `Event` ✅ (already implemented via runtime Bandsintown JSON-LD)
- `VideoObject` (documented; can show as video carousel in search)
- `Organization` / `Logo` (Google explicitly looks for `Organization.logo`)
- `WebSite` (name, language, publisher cross-ref)
- `FAQPage` (gated rich result since 2023, but still parsed by AI Overviews / ChatGPT / Perplexity)
- `Review` / `AggregateRating` (strict third-party rules)

Continued enrichment of `MusicGroup` / `MusicAlbum` is justified because the Knowledge Graph still ingests it — with no UI guarantee, but maximal readiness *if* the band crosses the notability threshold later.

**Goal motivation:** Maximum SEO / rich-result eligibility on Google. Includes feeding AI summaries (which parse the same JSON-LD).

**Out of scope:** off-site authority work (MusicBrainz, Wikidata, Wikipedia). On-site only.

---

## Architecture Overview

Continues the per-entity JSON-LD include pattern established in 2026-04-29: each schema entity has its own `_includes/jsonld/<entity>.html`, rendered from the visible section it describes, cross-referenced via `@id`.

### File layout

| Include | Type | Rendered from | Status |
|---|---|---|---|
| `_includes/jsonld/band.html` | `MusicGroup` | `_includes/about.html` | enriched |
| `_includes/jsonld/website.html` | `WebSite` | `_layouts/default.html` (head) | **new** |
| `_includes/jsonld/releases.html` | `MusicAlbum[]` | `_includes/music.html` | mod (review cross-ref) |
| `_includes/jsonld/videos.html` | `VideoObject[]` | `_includes/video.html` | **new** |
| `_includes/jsonld/reviews.html` | `Review[]` | `_includes/press.html` | **new** |
| `_includes/jsonld/faq.html` | `FAQPage` | new `_includes/faq.html` | **new** |
| `_includes/jsonld/events.html` | `MusicEvent[]` | `_includes/gigs.html` (runtime) | unchanged |

### Cross-reference graph

```
WebSite #website     ──► publisher  ──► MusicGroup #band

MusicGroup #band     ──► album      ──► MusicAlbum #release-{id}        (one per release)
MusicGroup #band     ──► track      ──► MusicRecording #track-{slug}    (top released singles)
MusicGroup #band     ──► founder    ──► Person #person-{slug}            (subset of member[])
MusicGroup #band     ──► member     ──► OrganizationRole → Person #person-{slug}

MusicAlbum #release  ──► byArtist   ──► MusicGroup #band
MusicAlbum #release  ──► review     ──► Review #review-{id}             (only when reviews exist)

Review               ──► itemReviewed ► MusicAlbum #release-{id}        (NOT band — review is of album)
Review               ──► author     ──► Person                           (inline)
Review               ──► publisher  ──► Organization                     (inline)

VideoObject          ──► about      ──► MusicGroup #band

MusicEvent           ──► performer  ──► MusicGroup #band                 (existing)

FAQPage                                                                  (standalone — Google's rule)
```

`@id` scheme is consistent with what's already in the repo: `{site.url}/#band`, `{site.url}/#release-{id}`, `{site.url}/#track-{slug}`. New types follow the same `{site.url}/#{kind}-{id}` pattern.

---

## Detailed design

### `_includes/jsonld/band.html` (enriched)

Current node has 11 fields. This brings it to 18, all sourced from data files.

**Adds:**

| Property | Source | Rationale |
|---|---|---|
| `logo` | `ImageObject` of `assets/FreakPointing_Logo.png` (full absolute URL via `site.url \| append`) w/ width+height (2507×1140) | Google looks for `Organization.logo` separately from `image`; required for the small logo in Org search results. Aspect ratio is wider than the recommended ≈square but validators pass; flagged as a future content task to commission a square asset. |
| `slogan` | `band.tagline` from `site_meta.yml` ("Dublin rock. Hard riffs. No filler.") | Knowledge-graph tagline surface |
| `email` | `band.email` (new field in `site_meta.yml`) — `lads@freakpointing.ie` | `Organization.email` |
| `founder[]` | `Person` `@id` refs to lineup entries with `founder: true` (Fearghal, Darryn — both started 2020-08) | Distinct from `member[]`. Beatles panel surfaces "Founded by …" |
| `album[]` | `[{"@id": "/#release-{id}"}, …]` for every release in `releases.yml` that has a `jsonld:` block (currently 4 visible + 1 `hidden: true` — matches the filter `releases.html` already uses, so every emitted `MusicAlbum` is referenced) | Cross-ref to existing `MusicAlbum` nodes; Knowledge-Graph album-carousel input |
| `track[]` | `[{"@id": "/#track-{slug}"}, …]` derived from released, non-hidden singles in `releases.yml` (auto-filter: `status: released` AND `type_label: Single` AND `hidden != true`) → currently The Circle Beneath, Stuck, Vainglorious. Track slug matches the pattern emitted by `releases.html` (`{site.url}/#track-{name \| slugify}`) | Knowledge-Graph top-songs input; auto-updates as new singles release |

**Sub-change to existing `member[]`:** each `Person` inside `member` gains an `@id` (`{site.url}/#person-{slugified-name}`) so `founder[]` can reference them by `@id` instead of duplicating Person nodes.

**Deliberately NOT added:**
- `subjectOf` pointing at the review — the review is *about the EP*, not the band. Cross-ref lives on the EP's `MusicAlbum` node instead (via `review[]`).
- `event[]` — existing `MusicEvent.performer.@id` cross-ref is sufficient bidirectionally for Google. Adding runtime mutation of an already-emitted band JSON-LD script is fragile.
- `areaServed` — `foundingLocation` already implies the band's home territory.
- `legalName` — same as `name`, no value.

### `_includes/jsonld/website.html` (new)

```jsonld
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "{site.url}/#website",
  "url": "{site.url}",
  "name": "Freak Pointing",
  "publisher": { "@id": "{site.url}/#band" },
  "inLanguage": "en-IE"
}
```

No `SearchAction` — there's no on-site search, and Google deprecated the sitelinks search box in 2024. Rendered from `_layouts/default.html` so it's always in `<head>` regardless of page.

### `_includes/jsonld/videos.html` (new)

One `VideoObject` per entry in `_data/videos.yml`. Required Google fields: `name`, `description`, `thumbnailUrl`, `uploadDate`. Each video also gets `about: { "@id": "/#band" }`.

Two videos initially:

1. **Self-hosted** (`hosting: self`): emits `contentUrl` (full URL of MP4) + `thumbnailUrl` (full URL of webp thumb). `sameAs` lists the original Instagram permalink.
2. **YouTube** (`hosting: youtube`): all URLs derived from `youtube_id` in the template:
   - `embedUrl: https://www.youtube.com/embed/{id}`
   - `contentUrl: https://www.youtube.com/watch?v={id}`
   - `thumbnailUrl: https://i.ytimg.com/vi/{id}/maxresdefault.jpg`

### `_includes/jsonld/reviews.html` (new)

One `Review` node per entry in `_data/reviews.yml`. Schema:

```jsonld
{
  "@context": "https://schema.org",
  "@type": "Review",
  "@id": "{site.url}/#review-{id}",
  "itemReviewed": { "@id": "{site.url}/#release-{reviewed_release}" },
  "reviewRating": { "@type": "Rating", "ratingValue": "9", "bestRating": "10" },
  "author": { "@type": "Person", "name": "{reviewer.name}" },
  "publisher": { "@type": "Organization", "name": "{publisher.name}" },
  "reviewBody": "{body}",
  "datePublished": "{date_published}"
}
```

Initial seed: one review (Dorn Simon / Into d'Groove / 9/10) of the upcoming EP `too-tall-to-see-the-moon`.

Google's review-snippet eligibility rule: the reviewed content must be visible on the same page as the markup. Already satisfied — `_includes/press.html` renders the quote and links to the full PDF.

### `_includes/jsonld/faq.html` (new)

`FAQPage` with one `Question` per entry in `_data/faqs.yml`:

```jsonld
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "{site.url}/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{question}",
      "acceptedAnswer": { "@type": "Answer", "text": "{answer}" }
    }
  ]
}
```

Standalone — no cross-references in or out (Google's rule for `FAQPage`).

### `_includes/jsonld/releases.html` (mod)

Add a `review[]` field to the `MusicAlbum` node when the release's `jsonld:` block has a `review_ids:` list:

```liquid
{%- if r.jsonld.review_ids -%}
  ,"review": [
    {%- for rid in r.jsonld.review_ids -%}
      { "@id": "{{ site.url }}/#review-{{ rid }}" }
      {%- unless forloop.last -%},{%- endunless -%}
    {%- endfor -%}
  ]
{%- endif -%}
```

---

## Data files

### New

**`_data/videos.yml`**:
```yaml
- id: thumbtacks-live
  name: "Thumb Tacks (Live)"
  description: "TODO — 1 sentence"
  upload_date: "TODO"   # YYYY-MM-DD
  hosting: self
  content_url: /assets/videos/thumbtacks.mp4
  thumbnail_url: /assets/videos/thumbtacks-800.webp
  same_as:
    - https://www.instagram.com/freakpointingband/p/DWQ4JmijZU2/

- id: youtube-jqkvxvb9bbo
  name: "TODO"
  description: "TODO"
  upload_date: "TODO"
  hosting: youtube
  youtube_id: JQkVXvB9BBo
  # content_url, thumbnail_url, embed_url derived from youtube_id in the template
```

**`_data/reviews.yml`**:
```yaml
- id: into-d-groove
  reviewer: { name: "Dorn Simon" }
  publisher: { name: "Into d'Groove" }
  rating: 9
  best_rating: 10
  date_published: "TODO"  # YYYY-MM-DD
  reviewed_release: too-tall-to-see-the-moon
  body: |
    Halfway through the first track I was already hooked. Fresh, loud,
    crisp in its delivery — these guys have delivered not only a
    listenable release, but a highly enjoyable one.
```

(Body matches the visible quote in `press.html`, with the `&mdash;` HTML entity resolved to a real Unicode em-dash for JSON-LD safety.)

**`_data/faqs.yml`**:
```yaml
- question: "Where is Freak Pointing from?"
  answer: "Freak Pointing are a four-piece rock band from Dublin, Ireland, formed in 2020."

- question: "Who's in Freak Pointing?"
  answer: "Fearghal Traynor (vocals), Darryn Downey (guitar), Daragh Cosgrove (bass), and Stephen Coogan (drums)."

- question: "What kind of music does Freak Pointing play?"
  answer: "Rock — hard riffs, melodic anthems, punk energy. Influenced by hard rock and grunge."

- question: "Where can I listen to Freak Pointing?"
  answer: "Spotify, Apple Music, Bandcamp, and YouTube Music. Links are in the Listen section above."
```

### Modifications to existing

- **`_data/site_meta.yml`** — under `band:`, add `email: lads@freakpointing.ie`.
- **`_data/lineup.yml`** — add `founder: true` to Fearghal Traynor and Darryn Downey.
- **`_data/releases.yml`** — under `too-tall-to-see-the-moon`, add to its `jsonld:` block:
  ```yaml
      review_ids:
        - into-d-groove
  ```

---

## Visible FAQ section

New `_includes/faq.html`, slotted between `gigs.html` and `contact.html` in `index.html`:

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

`<details>` is explicitly Google-allowed for FAQ rich-result eligibility (the answer is in the DOM regardless of open state).

**Styling** (sketch — fits existing aesthetic):

- Pure black background; sharp edges; no rounded corners.
- `summary` styled as section-list item (white, heavy display font); accent colour (`#c026d3`) on `:hover` and `[open]`.
- Expanded answer in mid-grey body text.
- Custom triangle/disclosure marker rather than the browser default.
- Mobile-first; full-width on small screens; max-width matches other sections.

CSS scope: ~20 lines following patterns already in `style.css`.

---

## Validation plan

1. **Schema.org structure** — `validator.schema.org` against the deployed page (or against a locally-served Jekyll build via `bundle exec jekyll serve`). Confirm zero errors and zero warnings.
2. **Google Rich Results Test** — `search.google.com/test/rich-results`. Confirm detection of: Organization (with logo), WebSite, MusicGroup, MusicAlbum (×4 visible + 1 hidden), Event (×N from runtime), VideoObject (×2), Review (×1), FAQPage.
3. **Lighthouse SEO** — `npx lighthouse <url> --only-categories=seo`. Confirm score stays at 100; structured-data audit passes.
4. **Manual cross-ref check** — `curl <url> | grep '@id'` and inspect that every cross-reference resolves to a real `@id` emitted somewhere in the same page.

---

## Pre-deploy TODOs (placeholder values to fill)

The following entries ship with `TODO` placeholders; deploy is gated on filling them in:

- `_data/videos.yml` thumbtacks-live: `description`, `upload_date`
- `_data/videos.yml` youtube-jqkvxvb9bbo: `name`, `description`, `upload_date`
- `_data/reviews.yml` into-d-groove: `date_published`

Including JSON-LD with literal `"TODO"` values would be ingested by Google verbatim. The user has explicitly chosen to gate deploy on filling these in rather than introducing a `published:` flag pattern.

---

## Future / out-of-scope

Captured here so they're not lost:

- **Square logo asset.** Current `FreakPointing_Logo.png` is 2507×1140 (~2.2:1). Google's `Organization.logo` guidance is "square or near-square, ≥112px." A new square logo asset would be the proper long-term fix.
- **Off-site authority records.** MusicBrainz artist entry (free; feeds Wikidata), then eventually a Wikidata entity. These are the actual gate for an indie band's Knowledge Panel; on-site work alone won't surface one.
- **Additional reviews.** As more press accumulates, add to `_data/reviews.yml`. Each release's `jsonld.review_ids` list grows; cross-refs handle the rest.
- **`AggregateRating`.** Once there are ≥2 reviews of the same release, Google can show an aggregate-rating star widget. Trivial template change at that point.
