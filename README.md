# bridge-viewer

Renders [BML](https://github.com/gpaulissen/bml) bridge-bidding-system files
(`.bml`, as used in
[gpaulissen/bridge-systems](https://github.com/gpaulissen/bridge-systems))
as a collapsible, suit-colored bidding tree in the browser.

Three parts:

- `scripts/bml2json.py` -- converts a `.bml` file to JSON, by reusing the
  real upstream `bml` parser (not a reimplementation of the grammar).
- `scripts/extract_abbreviations.py` -- builds a `{ABBREVIATION: definition}`
  lookup table from `bml`'s own `common/abbreviations.bml`, the same way.
- `app/` -- a Vue 3 + Vite app that renders that JSON (and the lookup table,
  as hover tooltips).

## 1. Generate JSON from a BML file

Requires the `bml` package:

```bash
pip install git+https://github.com/gpaulissen/bml.git
```

Then, from a checkout of `bridge-systems` (so `#INCLUDE`s like
`common/2C.bml` resolve):

```bash
python3 scripts/bml2json.py path/to/system-WG-GJP.bml -o app/src/data/system-WG-GJP.json
```

`app/src/data/system-WG-GJP.json` is already checked in as a working
example (generated from the real `bridge-systems` repo), so you can run the
app immediately without doing this step first.

To add another system, generate its JSON into `app/src/data/` the same way --
the app picks up every `*.json` file there automatically (via
`import.meta.glob`) and lists it in the system picker, no code changes
needed. The in-app editor (below) can also create one from scratch.

## 2. Run the app

```bash
cd app
npm install
npm run dev
```

## Abbreviation tooltips

BML descriptions are dense with WBF shorthand (`BAL`, `HCP`, `FG`, `NAT`, ...).
`app/src/reference/abbreviations.json` is a generated lookup table (99
entries) built from `bml`'s own `common/abbreviations.bml`:

```bash
python3 scripts/extract_abbreviations.py path/to/common/abbreviations.bml \
  -o app/src/reference/abbreviations.json
```

It lives outside `app/src/data/` deliberately, so it isn't picked up by the
`*.json` system-discovery glob in `App.vue` -- it's shared reference data,
not a system.

`app/src/utils/formatText.js` uses it to wrap any recognized abbreviation in
a native `<abbr title="...">`, so hovering `BAL` anywhere text is rendered
(View mode, and the Edit-mode live previews) shows "Balanced" as a tooltip
-- no separate glossary lookup needed. Matching requires a non-alphanumeric
boundary on both sides, so it only fires on an abbreviation used as its own
token (`, BAL,` or `4+m`) and correctly leaves digit-attached bid-shape
notation alone (`5M`, `2C`).

The generator excludes the one list in `abbreviations.bml` explicitly
marked "not used" (`DBL`/`RDBL`/etc. -- BML uses `D`/`R` instead), based on
the paragraph text preceding each list rather than a hardcoded index, so it
stays correct if the source file gains or loses a list.

## Editing a system in the browser

Editing the JSON by hand is exactly the "not user friendly" problem BML
itself was meant to solve for bidding notation, so the app has a form-based
editor instead: click **Edit** (top right) to switch from the read-only tree
view to an editable one -- meta fields, headings/paragraphs/lists, and the
bid tree itself (add/delete/reorder bids and rebids, edit descriptions),
each with a live preview showing the actual suit-colored/bold/italic
rendering -- abbreviation tooltips included -- as you type.

**Save changes** writes straight back to `app/src/data/<file>.json` via a
dev-only API (`vite.config.js`'s `bmlDataApi` plugin, a small
`server.middlewares` handler that only exists under `npm run dev` -- it's
not part of the production build, and it validates the filename against
`src/data/` to prevent writing anywhere else). Saving triggers Vite's own
file-watcher, which reloads the page so View mode immediately reflects the
change. If the API isn't reachable (e.g. you're running `vite preview`
instead of `vite dev`), use **Download JSON** instead and move the file into
`src/data/` yourself.

**+ New** creates an empty system from a filename and switches you into it
once Vite picks up the new file.

Nothing here touches `.bml` files or `scripts/bml2json.py` -- the editor
only edits the JSON. If you regenerate a system's JSON from its `.bml`
source later, that overwrites any edits made in the browser (and vice
versa), so pick one as the source of truth per system.

## Notes on the JSON shape

```jsonc
{
  "meta": { "TITLE": "...", "AUTHOR": "...", "DESCRIPTION": "..." },
  "items": [
    { "type": "heading", "level": 1, "text": "Introduction" },
    { "type": "paragraph", "text": "..." },
    { "type": "list", "items": ["...", "..."] },
    {
      "type": "bidtable",
      "children": [
        { "bid": "1C", "desc": "2+!c, NAT or BAL, 11+ HCP", "export": true, "children": [ /* rebids */ ] }
      ]
    }
  ],
  "skipped_types": []
}
```

- `desc` strings use `!c !d !h !s` for suit shorthand, `*bold*`/`/italic/`/`=code=`
  for inline markup, and a literal `\n` (two characters) for a line break within
  one description -- the same conventions BML itself uses. `app/src/utils/formatText.js`
  reproduces the same substitutions the upstream `bml2html.py` applies, so the
  rendered output matches the official HTML/PDF output.
- `bml2json.py` also unwraps a synthetic `"{}"` wrapper node that `bml`'s parser
  inserts around parallel top-level bids purely to satisfy a LaTeX `dirtree`
  constraint -- it carries no bidding information, so the JSON's `bidtable.children`
  is already the real list of top-level bids.
- `skipped_types` lists any LaTeX-only content (`DIAGRAM`, `TABLE`, `BIDDING`) found
  in the file. Like the upstream `bml2html.py`, this script doesn't render those --
  they don't currently appear in the `bridge-systems` files, but if a system ever
  does use one, `SystemDocument.vue` shows a small notice ("Not shown here: 2 hand
  diagrams...") rather than silently dropping it with no on-screen sign anything
  was left out.

## Ideas for later

- Search/filter box to jump to a bid sequence.
- Deep-linkable URLs per branch (e.g. `#1C-1D-1N`).
- A Vite plugin that watches `.bml` files and re-runs `bml2json.py` automatically
  during `npm run dev`, instead of the manual step above.
- Export edited JSON back to `.bml` text, so edits made in the browser editor
  can flow back into the original bidding-system source files.
