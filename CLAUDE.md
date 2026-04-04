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
