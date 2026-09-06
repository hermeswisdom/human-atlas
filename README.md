# Human Atlas

An educational 3D anatomy explorer by **hermeswisdom** (SMLC build). This repository is a fork of [ashemag/human-atlas](https://github.com/ashemag/human-atlas).

Take the BodyParts3D adult male reference apart into **2,234 individually selectable meshes**, explore **15 anatomical systems**, and search **3,432 named concepts**.

This is an educational explorer, not a diagnostic or surgical tool. It is not intended for clinical decision-making, diagnosis, treatment, or surgical planning. **hermeswisdom does not claim authorship of BodyParts3D.**

**Do not deploy this fork to Vercel or other public hosting until the owner says so.** Run it locally.

## Explore

- Orbit, zoom, and select structures directly on the body.
- Toggle individual systems or use skeleton and organ presets.
- Move from assembled anatomy to a spaced inventory of every visible piece.
- Search anatomical names and source identifiers.
- Isolate a selected structure and read its details.
- Share a view with URL query parameters (systems, selection, explode).
- Use compact controls and detail panels on mobile.

## Run locally

Requires Node.js 22.13 or newer. No API keys or accounts are needed.

```sh
npm ci
npm run dev
```

Open http://localhost:3016. To build the static site, run `npm run build`; the output is in `dist/`.

## Shareable views

The viewer reads query parameters once atlas data is ready, then keeps the address bar in sync with `history.replaceState` as you change systems, selection, or explode. Invalid identifiers are ignored and dropped from the URL. Camera orbit angles are not encoded.

| Parameter | Also accepted | Examples | Effect |
|---|---|---|---|
| `system` | `systems` | `system=skeletal`, `system=organs`, `system=all`, `system=none`, `systems=cardiac,digestive` | Visible anatomical systems, or a preset (`skeleton`/`skeletal`, `organs`, `all`, `none`). Unknown system ids are skipped. |
| `select` | `concept` | `select=FMA7088`, `select=heart`, `select=FJ3365` | Select a concept id, mesh id, or searchable name. Ambiguous or unknown values are ignored. |
| `explode` | | `explode=1`, `explode=exploded`, `explode=0.5`, `explode=assembled` | Assembled (`0`) versus exploded inventory (`1`). Values from `2` to `100` are treated as percents. |

Examples after `npm run dev`:

- http://localhost:3016/?select=heart
- http://localhost:3016/?system=organs&select=FMA7088
- http://localhost:3016/?system=skeletal&explode=1
- http://localhost:3016/?systems=nervous,sensory&concept=brain

## Validate

```sh
npm run check
node scripts/validate-atlas.mjs
node scripts/validate-interactions.mjs
node --experimental-strip-types scripts/validate-url-state.mjs
npm run build
```

Validation covers mesh buffers, names and concept membership, nonoverlapping exploded layouts at desktop and mobile aspect ratios, search and inspection contracts, shareable URL parse/serialize, and tap-versus-drag handling. Browser interaction checks have exercised selection, system controls, search, isolation, rotation, and 390×844, 320×568, and 844×390 layouts. Phone controls stay clear of the exploded inventory, and isolated structures fit the space above or beside the detail panel. Physical-device performance and real multitouch hardware have not been tested.

## Anatomy data

The current viewer uses **BodyParts3D 4.0**, an adult male reference anatomy, licensed **CC BY 4.0**. It does not represent every human structure or variation. Individual source meshes are distinct from named concepts, which may group multiple meshes. Descriptions distinguish general system context from individual organ explanations.

Geometry is simplified for browser performance while retaining every source mesh. The packaged model contains 2,288,268 triangles and downloads approximately 33 MB of compressed geometry. Full credits, source links, and adaptation details are in [ATTRIBUTION.md](public/ATTRIBUTION.md).

This is an educational explorer, not a diagnostic or surgical tool.

## How it works

Geometry is merged into batches. Per-structure GPU textures control translation, visibility, and selection, while component geometry supports accurate picking. Exploded layouts pack only the visible pieces. Rendering updates when the scene changes; orbit controls remain responsive without thousands of separate draw calls.

The optional WebMCP tools expose anatomy search and inspection in compatible browsers. The visible interface works without them.

## Rebuilding geometry

The repository includes browser-ready geometry. Rebuilding it is optional: obtain the official BodyParts3D OBJ archive and English metadata tables, prepare the joined concepts and display-system mappings, run `scripts/convert-anatomy.py`, then `node scripts/optimize-anatomy.mjs` and `node scripts/compress-models.mjs`. Simplification uses a 0.2% relative error limit per structure.

## Deploy

Do **not** publish this fork to Vercel or any other public host until the repository owner asks for a public deployment. The included `vercel.json` is leftover from upstream and is not an invitation to ship a live site.

## License

Original application code is released under the [MIT License](LICENSE). **The anatomy data has its own CC BY 4.0 license**; preserve the attribution when redistributing it. Third-party dependencies retain their respective licenses. Keep [ATTRIBUTION.md](public/ATTRIBUTION.md) with the data.

Issues and pull requests are welcome. Please include reproduction steps and browser/device details for interaction problems.
