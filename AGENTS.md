# Agent Guidelines

## Commands
- **Build**: `bash build.sh` (creates extension zip)
- **Test**: Manual only - load unpacked extension in `chrome://extensions`, test JSON formatting, folding, line numbers
- **Local server**: `python3 -m http.server 8000` (serve test.json)
- **Single test**: Open `http://localhost:8000/test.json` and verify UI features

## Code Style
- JavaScript only, Chrome Extension MV3 compatible
- 4-space indentation, single quotes for strings
- Descriptive function/variable names (camelCase)
- JSON.stringify with 2-space indentation for formatting
- Avoid new permissions unless required
- No comments unless explicitly requested

## Architecture
- `manifest.json`: Extension config, permissions, CSP
- `content.js`: JSON detection and rendering via Shadow DOM
- `formatter.js`: Options page paste-to-format functionality
- No build tools - direct file modification

## Testing Guidelines
- No automated test framework
- Manual verification: small/large JSON, arrays/objects, invalid JSON, `<pre>`-wrapped JSON
- Test both formatted and raw JSON displays