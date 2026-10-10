# PDF Editor Diagnostic & Fix Guide

## How to Use This Document
Work through each issue **in order** (Font → Spacing → Images → Layout Reflow). Don't skip ahead — issue 3 (images) uses the same coordinate math as issue 2 (spacing), so fixing spacing first will make the image fix faster and less error-prone. Do not start issue 4 (layout reflow) until 1–3 are confirmed fixed and tested — it's a bigger architectural change and you want a stable foundation before building on it.

For each issue: **Inspect → Fix → Verify (Done Looks Like) → Avoid.**

---

## Issue 1: Fonts Wrong

### Inspect
Open your PDF parsing code and find where you extract `item.fontName` from PDF.js `getTextContent()`. Answer these questions:
1. Are you passing `item.fontName` (e.g., `g_d0_f1`) directly into the Fabric.js `fontFamily` property? — If yes, this is your bug.
2. Do you have a font-mapping dictionary that translates PDF base font names (Helvetica, Times-Roman, Courier, etc.) to web-safe equivalents? — If missing, this is your bug.
3. Are bold/italic variants (e.g., `Arial-BoldMT`, `TimesNewRomanPS-ItalicMT`) being parsed to extract weight/style, or is the full string being used as-is? — If the full string is used as-is, bold/italic will silently fail to render correctly.

### Fix
1. **Get the real font name.** `item.fontName` from `getTextContent()` is an internal alias. To get the actual base font, access the page's font resource dictionary (via `page.commonObjs` or `page.objs` in PDF.js, depending on version) and look up the font object using the alias — the font object has a `.name` or `.fallbackName` property with the real PostScript font name.
2. **Build (or complete) the font-mapping dictionary.** At minimum map:
   - `Helvetica` → `Arial`
   - `Times-Roman` / `TimesNewRoman` → `Times New Roman`
   - `Courier` → `Courier New`
   - Anything unrecognized → fallback to `Arial` (don't fail silently to a random browser default)
3. **Parse weight/style from the font name string.** Check for substrings: `Bold`, `Italic`, `Oblique`. Set `fontWeight: 'bold'` and/or `fontStyle: 'italic'` on the Fabric object independently of `fontFamily`. Do not bake weight/style into the font family string alone.
4. **Store the mapping decision alongside the object.** When you serialize the canvas for reconstruction, you need to know whether the font was substituted, so pdf-lib can pick an equivalent embeddable font (e.g., Helvetica-Bold) rather than guessing again from a Fabric font family string.

### Done Looks Like
- Every text object on canvas shows a real font name (Arial, Times New Roman, etc.) — never an internal ID like `g_d0_f1`.
- Bold and italic text in the original PDF visibly renders bold/italic on canvas, not regular weight.
- Reconstructed PDF uses the same font family/weight/style as what was shown on canvas — no silent fallback to a default font in the output.

### Avoid
- Don't hardcode a single fallback font for *all* unmapped fonts without logging which fonts were unmapped — you'll want that data to expand your mapping table later.
- Don't parse weight/style by checking `fontSize` or position — weight/style comes from the font name, not layout properties.
- Don't change the font-mapping logic without re-testing PDFs that use standard fonts (Helvetica, Times) — a bug here can regress previously-working documents.

---

## Issue 2: Spacing Wrong

### Inspect
1. Find your line-height / leading calculation. Are you using a **fixed value** (e.g., `fontSize * 1.2` always) instead of measuring the actual vertical gap between consecutive text item baselines from the extracted Y positions?
2. Find your Y-axis flip formula (should be something like `canvasY = pageHeight - pdfY - elementHeight`). Confirm: is `elementHeight` actually derived from font ascent + descent, or is it a bounding-box height value from PDF.js that may not match the font metrics? These are often different numbers, and using the wrong one produces a consistent vertical offset error across the whole document.
3. Check whether the original PDF uses custom character spacing (`Tc`) or word spacing (`Tw`) operators. `getTextContent()` from PDF.js does not always expose these in `item.str` — if present in the source PDF, reconstructed text will look subtly compressed or expanded even with correct font and size.

### Fix
1. **Measure real line-height from data, not a constant.** For each pair of consecutive text runs in the same block, compute the actual Y-delta between their transform origins. Use that as the line-height for reconstruction rather than an assumed multiplier — this preserves the original document's actual spacing, including cases where the source used non-standard leading.
2. **Standardize on one height value for the Y-flip formula** and use it consistently in both the parse step and the reconstruction step. If you extract using font ascent/descent, use that same figure when converting back — don't mix bounding-box height in one direction and font-metric height in the other.
3. **If custom character/word spacing is common in your users' documents**, extract `Tc`/`Tw` values from the raw content stream operators (not `getTextContent()` — you'll need `getOperatorList()` and to parse `Tc`/`Tw`/`Tz` operators directly) and apply them as `charSpacing` in Fabric and as manual character positioning in pdf-lib on reconstruction. If this is rare in your use case, skip it for now and note it as a known limitation rather than over-engineering.

### Done Looks Like
- Multi-line paragraphs on canvas show the same visual line spacing as the source PDF when compared side-by-side at the same zoom level.
- The vertical offset between canvas rendering and reconstructed PDF output is consistent (i.e., not drifting further off on later lines or later pages) — drift indicates you're still using two different height values in the two conversion directions.
- Text density (characters per line, line spacing) in the output PDF visually matches the input PDF for a same-length, unedited paragraph.

### Avoid
- Don't tune line-height by eyeballing one test PDF and hardcoding the number you land on — verify against at least 3–4 structurally different PDFs (different generators: Word-exported, LaTeX-exported, Google Docs-exported) since leading conventions differ between them.
- Don't change the Y-flip constant in only one of the two conversion directions (parse vs. reconstruct) — they must stay symmetric or you'll introduce a new offset bug.
- Don't conflate word wrap logic with line-height fixes — they're separate bugs even though both show up as "spacing wrong."

---

## Issue 3: Images Jumping

### Inspect
1. Find where you calculate `scaleX` / `scaleY` for images when loading onto canvas. Confirm whether it's computed from the **original PDF image dimensions** vs. **the displayed/rendered canvas dimensions**. Mixing these two sources between load-time and save-time is the most common cause of this bug.
2. Confirm you're using the **same Y-flip formula and the same height value** for images as you fixed for text in Issue 2. Images need `elementHeight` = the image's actual height, not a text metric — check you haven't copy-pasted the text conversion logic without swapping in the right height source.
3. Check your serialization step (canvas → data sent to `/api/reconstruct-pdf`): are you recalculating scale from the object's *current* canvas state (`object.width * object.scaleX`) at serialization time, or from a cached/stale value captured at load time? If the user has resized or the canvas has re-rendered at a different zoom, a stale value will cause a jump specifically after reconstruction, even though it looked correct during editing.

### Fix
1. **Pick one source of truth for image dimensions** — the original extracted width/height from the PDF — and always scale relative to that, both when placing on canvas and when serializing for reconstruction. Never recalculate scale from a previously-scaled value (avoid scaling a scale).
2. **Use the identical Y-flip formula as text**, substituting the image's real height: `canvasY = pageHeight - pdfY - imageHeight`, and the inverse on reconstruction: `pdfY = pageHeight - canvasY - imageHeight`.
3. **Serialize scale live from the Fabric object at save time** — call `object.getScaledWidth()` / `object.getScaledHeight()` (Fabric.js built-ins) rather than manually multiplying `width * scaleX`, since these account for any group transforms or nested scaling you might otherwise miss.

### Done Looks Like
- An image placed in the top-left of the source PDF appears in the top-left of the canvas, and after an edit + reconstruction with no changes to that image, it reconstructs to the exact same position in the output PDF.
- Resizing an image on canvas and saving produces an output PDF where the image is at the new size and position — not the original size, and not some in-between value.
- Testing with a PDF containing multiple images of different sizes on one page confirms none of them drift or swap positions relative to each other.

### Avoid
- Don't reuse a text-specific height/conversion function for images without checking every value inside it is appropriate for images — the two look similar but use different height sources.
- Don't test image position fixes using only square or small images — test with a large image and a small image on the same page, since scale-calculation bugs often only become visible at extreme sizes.
- Don't apply a fix here without re-running the Issue 2 tests afterward — since both rely on the same Y-flip formula, a change in one direction of the codebase can silently affect the other.

---

## Issue 4: Layout Breaks on Text Length Change

**Do not start this until Issues 1–3 are fixed and verified.** This is a genuine architecture change, not a bug fix, and you want fonts/spacing/images to be trustworthy before you build reflow logic on top of them — otherwise you won't be able to tell which layer a new bug is coming from.

### Inspect
1. Confirm your current implementation: each text run is likely an independent, absolutely-positioned Fabric object with a fixed `left`/`top`. There is no relationship between one text object and the one below it. Confirm this is the case — if so, that's why nothing moves when text grows.
2. Check whether you currently group text runs into any kind of "block" or "paragraph" structure at all, or whether every line/run is fully independent. Most likely: no grouping exists yet.

### Fix (high-level — this is a build, not a patch)
1. **Add a block-detection pass** during parsing: group text runs into paragraph-level blocks using vertical proximity (line-height-consistent gaps = same block), horizontal alignment (consistent left edge = same block), and font consistency (a font change usually signals a new block, e.g., heading vs. body).
2. **Represent each block as a flow container**, not a set of independent text objects: a bounding box (from original layout) plus real text content rendered via HTML/contenteditable positioned absolutely over the canvas — not multiple Fabric `IText` objects per block. This is what gives you real word-wrap and text flow inside the block.
3. **Add overflow handling**: when edited text exceeds the block's original height, decide (and implement) one behavior — auto-shrink font, or grow the block and push blocks below it down (recalculating their positions), or clip. Growing + pushing is the real "Word-like" behavior but requires a layout recalculation step that runs on every edit, plus page-break logic if growth pushes content past the page boundary.
4. **Update reconstruction** to walk blocks using their *current* (possibly shifted) positions rather than the original static coordinates, and implement real text-wrapping in the pdf-lib draw step (measure text width against block width, insert line breaks manually — pdf-lib does not auto-wrap).

### Done Looks Like
- Editing a sentence to be longer inside a paragraph causes the rest of that paragraph to reflow and wrap correctly within its original column width.
- If growth exceeds the block's original box, content below it visibly shifts down to make room (or your chosen overflow strategy behaves consistently and predictably every time, not just sometimes).
- Reconstructed PDF reflects the new, edited positions of every block — not the original extracted coordinates.

### Avoid
- Don't build this by patching your existing Fabric-object-per-line architecture — trying to make independent objects "aware" of each other's height changes is fragile and will produce inconsistent behavior. Build the block/container layer as a new rendering path.
- Don't skip separate handling for multi-column layouts and tables — feeding table rows or multi-column text through generic paragraph-clustering logic will misgroup them. Treat detection of these as a separate, explicit step, not an edge case inside paragraph clustering.
- Don't attempt full-page reflow (content pushing onto a new page) in the same pass as basic within-column push-down — ship push-down-within-page first, and treat page-break-inducing overflow as a distinct, later feature with its own testing.
- Don't remove or bypass your Issue 1–3 fixes while restructuring rendering — since you're changing how text is rendered (HTML/contenteditable layer vs. Fabric text objects), re-verify font mapping and spacing conversion still apply correctly in the new rendering path; a rendering-layer change can silently reintroduce a fixed bug if the same value isn't carried over.

---

## General Rule Across All Four Fixes
Before changing any conversion formula (font mapping, Y-flip, scale calculation), **write down which existing tests/PDFs currently work correctly**, and re-test all of them after each fix — not just the PDF that exposed the bug you're chasing. These four issues share underlying math (coordinate conversion, height values), so a fix aimed at one can regress another if you don't check the full battery each time.