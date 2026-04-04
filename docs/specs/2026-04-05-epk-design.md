# Freak Pointing EPK — Design Spec & Implementation Plan

## Context

Freak Pointing are a four-piece Dublin rock band (formed 2020) with two singles on Spotify and an EP (*Too Tall To See The Moon*, 4 tracks) dropping May 22nd 2026. They currently have no website — freakpointing.ie redirects to a Linktree. The goal is to replace that with a proper Electronic Press Kit: a single-page site that serves venue bookers, festival promoters, and press, while also functioning as their main web presence and Linktree replacement.

All assets are in `/Users/stephen.coogan/dev/freakpointing.ie/assets/`:
- `FreakPointing_Logo.png` — black fist logo on white
- `spotify_banner.jpg` — purple/pink logo on dark textured background
- `Stuck_Single_Artwork.jpg` — dark bg, pink/magenta + green
- `Vainglorious_Single_Artwork.jpg` — warm brown bg, green/blue tones
- `Too_Tall_To_See_The_Moon_EP_Artwork.jpg` — dark bg, teal/mint + blue
- `Freak Pointing Album review.pdf` — 9/10 review by Dorn Simon, Into d'Groove

Live photos: ~30 curated shots across three Flickr albums (see memory/reference_flickr_photos.md). Photos will be downloaded and served locally.

---

## Design Spec

### Visual Identity
- **Background:** Pure black (`#000000`)
- **Accent:** Purple/pink (`#c026d3`) — from Spotify banner
- **Text:** White (`#ffffff`) primary, mid-grey (`#888888`) secondary
- **Typography:** Heavy display font for headings (matching logo's bold/chunky feel), clean sans-serif for body
- **Aesthetic:** High-contrast, ink-splatter/punk energy — no rounded softness, sharp edges, bold

### Section Order (single scroll)
1. Hero
2. Music
3. About
4. Video
5. Photos
6. Press
7. Gigs
8. Contact

### Section Specs

**1. Hero**
- Full-bleed `spotify_banner.jpg` as background
- `FreakPointing_Logo.png` overlaid, centred or left-aligned
- Short punchy tagline (to be written — something like "Dublin rock. No filler.")
- Three CTA buttons: Spotify, Bandcamp, Apple Music
- Sticky top nav with jump links: Music · About · Photos · Press · Gigs · Contact

**2. Music**
- *Too Tall To See The Moon* EP: artwork + embedded Spotify player + "Out May 22nd 2026" badge
- Below: two single cards (*Stuck*, *Vainglorious*) with artwork + embedded Spotify players
- All artwork from local assets

**3. About**
- Band bio (expand from Spotify bio: "A Dublin-based, four-piece rock band formed in the summer of 2020. Bringing in influences from hard rock, grunge, metal, and folk, they combine these elements with memorable riffs and authentic lyrics to create melodic, musically-diverse anthems for the 21st century.")
- Member list: Fearghal Traynor — Vocals, Darryn Downey — Lead & Rhythm Guitars, Daragh Cosgrove — Bass Guitar, Stephen Coogan — Drums

**4. Video**
- Section with 2–3 placeholder embed slots (YouTube/Vimeo iframes)
- Marked clearly as "to be filled in" in the code with TODO comments
- Section visible but gracefully hides if no embeds are present

**5. Photos**
- Masonry grid layout (CSS columns)
- Click any photo → opens lightbox (full-screen overlay, prev/next navigation)
- Photos downloaded from Flickr and served locally from `assets/photos/`
- Lightbox: pure vanilla JS, no library dependency

**6. Press**
- Large styled pull quote: *"Fresh, loud, crisp in its delivery — these guys have delivered not only a listenable release, but a highly enjoyable one."*
- Attribution: Dorn Simon, Into d'Groove — 9/10 · ★★★★★
- Link to download full review PDF (`assets/Freak Pointing Album review.pdf`)

**7. Gigs**
- Table/list of upcoming shows
- Initial entry: Sunday May 24th 2026 — The International Bar, Dublin (with Stitch Jones)
- Simple structure, easy to add/remove rows by editing HTML

**8. Contact**
- Heading: "Book us / Get in touch"
- Email: lads@freakpointing.ie (mailto link)
- Streaming links: Spotify, Bandcamp, Apple Music
- Social links: Instagram (@freakpointingband)
- This section replaces the Linktree

---

## Implementation Plan

### Step 0: Project foundations
- `git init` the repo
- Create `CLAUDE.md` with project conventions (see below)
- Add `.gitignore` (ignore `.superpowers/`, `.DS_Store`, `node_modules/`)
- Save the design spec to `docs/specs/2026-04-05-epk-design.md` and commit

### Step 1: Project scaffolding
- Create `index.html`, `style.css`, `script.js` in project root
- Create `assets/photos/` directory

### Step 2: Download live photos from Flickr
- Fetch the curated photos from the three Flickr albums (see reference memory for album IDs and selected image names)
- Save to `assets/photos/` with sensible filenames

### Step 3: Base HTML structure
- `<!DOCTYPE html>` with semantic section elements matching the 8 sections
- Sticky nav with anchor links
- Meta tags: title, description, og:image (use spotify_banner.jpg), viewport

### Step 4: CSS
- CSS custom properties for colours and fonts
- Base reset and typography
- Sticky nav styles
- Hero section with banner background
- Section layouts (music grid, about, video placeholders, masonry photos, press quote, gigs table, contact grid)
- Responsive breakpoints (mobile-first)
- Lightbox overlay styles

### Step 5: Content — section by section
- Hero: banner, logo, tagline, CTA buttons
- Music: EP card + single cards with Spotify embeds
- About: bio text + member list
- Video: placeholder iframes with TODO comments
- Photos: masonry grid with all downloaded photos
- Press: styled quote block + PDF link
- Gigs: upcoming shows list
- Contact: email + all links

### Step 6: Lightbox JS
- Vanilla JS lightbox
- Click photo → overlay with full image, close button, prev/next arrows
- Keyboard support (Escape to close, arrow keys to navigate)

### Step 7: Polish & review
- Test on mobile
- Check all Spotify embeds load
- Verify PDF link works
- Check all external links open in new tab
- Invoke `superpowers:verification-before-completion` before declaring done

---

## Verification

1. Open `index.html` in browser — all 8 sections visible, scroll works cleanly
2. Sticky nav links jump to correct sections
3. Spotify embeds play (Music section)
4. Click a photo → lightbox opens, prev/next and Escape work
5. Press PDF link downloads correctly
6. Click lads@freakpointing.ie → mailto opens
7. All streaming/social links open correct destinations in new tab
8. Resize to mobile — layout holds, nothing overflows

---

## CLAUDE.md Contents

The `CLAUDE.md` file in the project root establishes conventions for any future Claude session working on this project:

```markdown
# Freak Pointing — freakpointing.ie

## Project Overview
Single-page EPK (Electronic Press Kit) for Freak Pointing, a Dublin rock band.
Static site: `index.html`, `style.css`, `script.js` — no build step, no framework.

## Design Spec
See `docs/specs/2026-04-05-epk-design.md` for the full design spec.

## Visual Identity
- Background: pure black (#000000)
- Accent: purple/pink (#c026d3)
- Text: white (#ffffff) primary, mid-grey (#888888) secondary
- Aesthetic: high-contrast, punk energy, sharp edges. No soft/rounded UI.
- Typography: heavy display font for headings, clean sans-serif for body
- All CSS colours and fonts use custom properties defined in style.css

## File Structure
- `index.html` — single-page site, all sections in one file
- `style.css` — all styles, mobile-first responsive
- `script.js` — lightbox, nav behaviour, any interactivity
- `assets/` — logo, artwork, banner, review PDF
- `assets/photos/` — live gig photos (served locally, sourced from Flickr)
- `docs/specs/` — design specs

## Conventions
- Vanilla HTML/CSS/JS only — no frameworks, no build tools, no npm
- Keep it in one HTML file. Do not split into multiple pages.
- All external links open in new tabs (target="_blank" rel="noopener")
- Spotify embeds use the standard iframe embed format
- Photos are served locally, not hotlinked from Flickr
- The Video section has placeholder TODO comments — do not remove them, they are intentional

## Band Info
- Members: Fearghal Traynor (vocals), Darryn Downey (guitar), Daragh Cosgrove (bass), Stephen Coogan (drums)
- Contact: lads@freakpointing.ie
- Instagram: @freakpointingband
- Streaming: Spotify, Bandcamp, Apple Music

## Skills & Agents
- Use `frontend-design:frontend-design` skill when making visual/design changes
- Use `superpowers:brainstorming` skill before adding new sections or major features
- Use `superpowers:verification-before-completion` before declaring any work complete
- Use Explore agents for understanding the codebase before making changes
- Use the code-reviewer agent after completing significant work
```

---

## Agent & Skill Usage During Implementation

- **Step 0 (scaffolding):** Direct work, no agents needed
- **Step 2 (Flickr download):** Use a general-purpose agent to handle the multi-step Flickr fetch
- **Steps 3–6 (build):** Apply `frontend-design:frontend-design` guidelines for all visual code. Use parallel agents if building independent sections simultaneously.
- **Step 7 (polish):** Invoke `superpowers:verification-before-completion` skill. Use `superpowers:requesting-code-review` agent for final review.
