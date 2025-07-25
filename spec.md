# Questline Theming Plugin Specification

## 1. Goal & Context

We are building a **Figma plugin** to support **theming questlines** in our social casino product. Designers author questlines in Figma by:

1. **Dropping a Questline/Board component** (background + quest slots).
2. **Swapping background art** and **placing/resizing Quest/Icon instances** freely.
3. **Entering a questKey** per quest and toggling visibility of keys.
4. **Using built‑in Boolean/variant controls** (showAllKeys, isDone) to preview states.

**Plugin Input in Figma:**

* A selected Frame (root) named `Questline: <slug>` with a `BG` layer and 3–20 `Quest/Icon` instances.
* Each `Quest/Icon` instance has:

  * Component property `questKey` (text input in sidebar, must be unique, lowercase, trimmed, no double whitespace, only edited in Figma).
  * Variant property `state=locked|done` (do not use boolean `isDone`).
  * Instance‐swap slots `LockedArt` & `DoneArt` for icons (vectors or images). If `Locked` variant is missing, use default; if `Done` is missing, throw error.
  * Resize/rotate transforms. Quest instances must have autolayout ignored (absolute positions only) and must be fully inside the questline parent bounds.
  * (Optional) Parent Boolean `showAllKeys` bound across all instances.

**Plugin Output:**

* A normalized JSON payload (`QuestlineExport`) containing:

  * `questlineId` (slug)
  * `frameSize` (width & height)
  * `background.exportUrl` (base64 data URL or uploaded URL)
  * Array of `quests` (3–20): each with `questKey`, `x,y,w,h,rotation`, and `lockedImg`/`doneImg` URLs.

This JSON drives our frontend questline UI, placing and rendering quest icons exactly as designed.

---

## 2. File Structure & Roles

```
figma-questline-plugin/
├─ package.json            # deps + scripts + figma-plugin manifest
├─ tsconfig.json
├─ webpack.config.js       # build definitions for main & ui bundles
├─ manifest.json           # plugin entry points
│
├─ src/
│  ├─ main/                # Figma sandbox code (no DOM)
│  │  ├─ index.ts          # figma.showUI, onmessage
│  │  ├─ scan.ts           # build ScanResult + Issue[]
│  │  ├─ export.ts         # exportAsync PNGs + assemble JSON
│  │  ├─ validators.ts     # zod schemas + business rules
│  │  ├─ errors.ts         # DesignerError codes/messages
│  │  └─ types.ts          # TS types for ScanResult & QuestlineExport
│  │
│  ├─ ui/                  # React iframe UI
│  │  ├─ index.tsx         # render <App />
│  │  ├─ components/
│  │  │  ├─ QuestTable.tsx     # table rows + key inputs + status cols
│  │  │  ├─ ErrorBanner.tsx    # shows errors/warnings
│  │  │  └─ PreviewCanvas.tsx  # optional live layout preview
│  │  ├─ hooks/
│  │  │  └─ usePluginMessages.ts # typed postMessage handler
│  │  ├─ state/                # optional atom store
│  │  └─ styles.css
│  │
│  ├─ shared/              # used by both main & ui bundles
│  │  ├─ constants.ts      # naming prefixes, limits
│  │  └─ utils.ts          # slugify, clamp, math, formatting
│  │
│  └─ __tests__/           # Jest/Vitest tests for scan & validators
│     ├─ scan.test.ts
│     └─ validators.test.ts
│
└─ dist/                   # build output (gitignored)
   ├─ main.js
   ├─ ui.html
   └─ ui.js
```

---

## 3. Functional Requirements

### 3.1 Scanning (src/main/scan.ts)

* Identify root frame: selected or first with name prefix `Questline:`.
* Require child layer `BG`.
* Discover 3–20 quest instances (type FRAME/GROUP) with `componentProperties.questKey` (do not use pluginData).
* For each quest:

  * Read `questKey` (slug format, unique, lowercase, trimmed, no double whitespace).
  * Read variant `state=locked|done` (do not use boolean `isDone`).
  * Locate child nodes `Locked` (if missing, use default) and `Done` (if missing, error).
  * Compute position & size: absoluteTransform → x,y,w,h,rotation relative to root frame. Quest must have autolayout ignored and be fully inside parent bounds.
* Emit `ScanResult` plus `Issue[]` for any missing BG, count errors, missing layers, empty/duplicate keys, out-of-bounds, autolayout enabled, or double whitespace in keys.

### 3.2 Validation (src/main/validators.ts)

* Define zod schemas:

  * `QuestExport` (key, x,y,w,h,rotation, lockedImg, doneImg)
  * `QuestlineExport` (3–20 quests, frameSize, background, slug id)
* Enforce slug regex `/^[a-z0-9-]+$/`, uniqueness (case-insensitive, trimmed), no double whitespace, and all other business rules above.

### 3.3 Exporting (src/main/export.ts)

* Ensure all issues resolved (errors block export, warnings do not).
* For BG, `exportAsync` → PNG file download to user’s computer (not base64 or upload).
* For each quest’s Locked/Done nodes, call `exportAsync` → PNG file download.
* If any image export fails, the whole export fails and a precise error message is shown.
* Assemble final JSON (only frame dimensions and array of quests: questKey, position, dimensions) and post to UI.

### 3.4 UI (src/ui/index.tsx)

* On mount: send `SCAN` message → receive data + issues.
* Render `ErrorBanner` with human tips per issue code.
* Render `QuestTable`: one row per quest, key input is read-only (edit in Figma), missing icons flagged.
* Disable “Export” until no errors.
* On export: send `EXPORT`, receive JSON → show in code editor (`react-simple-code-editor` + `prismjs`).
* “Copy JSON” button copies only the JSON object with main questline node dimensions and array of quests (questKey, position, dimensions).
* Implement a close-to-reality preview in `PreviewCanvas`.

## 4. Additional Business Rules

* questKeys must be unique (case-insensitive, trimmed)
* questKeys cannot have double whitespace
* quest instances must have autolayout ignored (absolute positions only)
* quest instances must be fully inside the questline parent bounds
* No more than 20 quest instances
* Only English is required for UI and errors
* No preference for testing framework


