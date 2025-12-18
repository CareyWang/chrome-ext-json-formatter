# Repository Guidelines

## Project Structure

- `manifest.json`: Chrome Extension Manifest V3 configuration (permissions, scripts, CSP).
- `content.js`: Content script; detects raw JSON pages, renders folding/line-number UI.
- `test.json`: Sample JSON for manual verification.

## Build, Test, and Development Commands

This repo is “no-build” (no npm/webpack). Develop by loading the folder as an unpacked extension:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this repository directory

Manual smoke checks:
- Open a JSON endpoint (or `test.json` via a local server) and confirm formatting, highlighting, folding buttons, and line numbers render.
- Example local server: `python3 -m http.server 8000` then open `http://localhost:8000/test.json`.
- If testing local files, enable “Allow access to file URLs” for the extension in `chrome://extensions`.

## Coding Style & Naming Conventions

- JavaScript only; keep changes compatible with Chrome Extension MV3.
- Follow existing conventions: 4-space indentation, single quotes for strings, and descriptive function/variable names.
- Keep JSON pretty-printing at 2-space indentation (see `JSON.stringify(..., null, 2)` usage).
- Avoid introducing new permissions unless required; document any permission changes in the PR.

## Testing Guidelines

- No automated test framework is currently configured.
- Prefer small, focused manual test cases (small/large JSON, arrays/objects, invalid JSON, pages with `<pre>`-wrapped JSON).

## Commit & Pull Request Guidelines

- Commits: short, imperative messages (e.g., “add README”, “fix folding toggle”).
- PRs: include a brief summary, steps to reproduce/verify, and screenshots for UI-affecting changes.
- Call out any changes to `manifest.json` permissions, host permissions, or CSP explicitly.
