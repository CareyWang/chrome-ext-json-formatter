# Chrome Store Assets Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate Chrome Web Store screenshots and promotional images for the extension.

**Architecture:** Use a deterministic HTML/CSS asset board that recreates the extension UI and marketing layouts, then render exact PNG dimensions through a browser screenshot pass. Save final uploadable files under a dedicated project asset directory.

**Tech Stack:** Static HTML, CSS, browser screenshots, PNG output.

---

### Task 1: Create Store Asset Source

**Files:**
- Create: `store-assets/source/chrome-store-assets.html`

**Step 1: Build source HTML**

Create one static HTML file containing seven fixed-size frames:

- `screenshot-1-auto-format`: 1280x800
- `screenshot-2-collapse`: 1280x800
- `screenshot-3-line-highlight`: 1280x800
- `screenshot-4-paste-page`: 1280x800
- `screenshot-5-local-fast`: 1280x800
- `promo-small`: 440x280
- `promo-marquee`: 1400x560

Use mixed Chinese and English copy and product-realistic UI mockups.

**Step 2: Verify layout manually**

Open the source in a browser-sized viewport and inspect each frame for clipped text or overlap.

### Task 2: Render PNG Assets

**Files:**
- Create: `store-assets/screenshots/screenshot-1-auto-format.png`
- Create: `store-assets/screenshots/screenshot-2-collapse.png`
- Create: `store-assets/screenshots/screenshot-3-line-highlight.png`
- Create: `store-assets/screenshots/screenshot-4-paste-page.png`
- Create: `store-assets/screenshots/screenshot-5-local-fast.png`
- Create: `store-assets/promotional/promo-small-440x280.png`
- Create: `store-assets/promotional/promo-marquee-1400x560.png`

**Step 1: Capture exact frames**

Use browser screenshot clipping based on each frame's bounding box.

**Step 2: Verify dimensions**

Run a local image metadata check and confirm exact dimensions:

- Screenshots: 1280x800
- Small promo: 440x280
- Marquee promo: 1400x560

### Task 3: Final Verification

**Files:**
- Check: `store-assets/screenshots/*.png`
- Check: `store-assets/promotional/*.png`

**Step 1: Confirm file list**

Verify all seven PNG files exist.

**Step 2: Confirm no extension runtime files changed**

Check `git status --short` and ensure changes are limited to `docs/plans` and `store-assets`.
