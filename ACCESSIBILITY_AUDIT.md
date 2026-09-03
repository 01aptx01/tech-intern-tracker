# WCAG 2.2 Level A and AA Accessibility Audit

## Executive conclusion

**Original audit result at commit `01f16ebc`: Does not conform to WCAG 2.2 Level AA within the audited scope.**

The review found **16 confirmed issues** and **1 manual-verification item**. Six confirmed issues are High severity, nine are Medium, and one is Low. The largest barriers are the light-theme color system, low-contrast control boundaries, invisible keyboard focus on filter chips, incomplete modal focus management, and controls that lose their accessible name or functionality at the mobile/reflow breakpoint.

**Remediation branch status:** all 17 numbered findings have been addressed in source on `fix/wcag-a11y-remediation`. The full automated verification suite passes, including source linting, strict type checking, 30 unit/integration tests, contrast-token assertions, modal accessibility regression tests, and a production build. Full WCAG conformance remains **not determined** until the manual browser and assistive-technology checks listed under Limitations are completed.

This is a focused interface audit and remediation record, not a legal-compliance determination.

## Scope and environment

- Product: Tech Internship Tracker
- Audited commit: `01f16ebca55dac24c8e8362410b859943523b11f`
- Audit date: 3 September 2026
- Standard: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), Levels A and AA
- Primary view: `http://127.0.0.1:3000/`
- States inspected from source: default dashboard, dark/light themes, `<768px` responsive state, filters, data table/cards, company drawer, conflict dialog, lock/error alerts, toast notifications, loading and empty states
- Workflows reviewed: search, filter, sort, pagination, add/edit/delete entry, quick status update, manual sync and conflict handling
- Evidence: React/TypeScript source, CSS tokens and breakpoints, server-rendered HTML snapshot, calculated sRGB contrast ratios, component regression tests, and headless Chromium visual snapshots at 500×900 and 1440×1000
- Data safety: no Excel mutation was performed

### Limitations

The interactive in-app browser-inspection connection was unavailable. Headless Chromium visual rendering was completed at 500×900 and 1440×1000, but keyboard traversal, browser-computed target rectangles at exactly 320 CSS px, 200% text resize, 400% zoom/reflow, screen-reader output, high-contrast mode, and focus-obscuring behavior still require a follow-up manual pass. Static and automated evidence is sufficient for the remediations recorded below; no claim of full conformance is made.

## Summary

| Original audit result | Count |
|---|---:|
| Confirmed failures | 16 |
| Needs manual verification | 1 |
| High severity | 6 |
| Medium severity | 9 |
| Low severity | 1 |

## Remediation status by annotation

| Annotation | Status | Implemented remediation | Regression evidence |
|---|---|---|---|
| A-01 | Addressed | Added theme-specific semantic foreground/background tokens for status, KPI, warning, error, and danger states. | `accessibility-tokens.test.ts` checks text pairs at 4.5:1 or better. |
| A-02 | Addressed | Added `--control-border` tokens meeting 3:1 and applied them to inputs, selects, filter chips, search, menus, pagination, and button boundaries. | Contrast token test plus source inspection. |
| A-03 | Addressed | Replaced translucent focus styling with an opaque, theme-specific `--focus-ring`; form and search focus use the same visible token. | Contrast token test checks both themes at 3:1 or better. |
| A-04 | Addressed | Added `input:focus-visible + span` styling so a focused transparent checkbox visibly outlines its chip. | Source inspection; keyboard browser confirmation remains in the manual pass. |
| A-05 | Addressed | Converted the drawer and conflict overlay to native modal dialogs using `showModal()`, initial focus, Escape cancellation, browser focus containment/background inertness, and focus restoration. | `dialog-accessibility.test.tsx` verifies modal open state, initial focus, and focus return. |
| A-06 | Addressed | Added native `required` semantics and screen-reader text for all required company, announcement, and evidence fields. | Component test verifies all three controls expose required state. |
| A-07 | Addressed | Wrapped the delete confirmation input in a visible label containing the exact confirmation instruction. | Component test queries the input by its full accessible name. |
| A-08 | Addressed | Added persistent numbered labels and leader lines to pie segments, plus matching numbered text in the legend; retained the text summary. | Source inspection; grayscale visual confirmation remains in the manual pass. |
| A-09 | Addressed | Added a check icon to each selected filter chip while retaining native checkbox state. | Source and component rendering inspection. |
| A-10 | Addressed | Added one atomic polite `<output>` that reports settled result count and current page. | Source inspection; Thai screen-reader announcement cadence remains in the manual pass. |
| A-11 | Addressed | Replaced the unmodified `/` shortcut with `Ctrl+K`/`Command+K` and excluded active editing controls. | Toolbar tests verify the modifier shortcut and confirm `/` is not intercepted. |
| A-12 | Addressed | Added the stable accessible name `เพิ่มบริษัท` and made every sync accessible name begin with the visible word `ซิงก์`. | Sync indicator tests cover synced and reading states. |
| A-13 | Addressed | Kept the theme toggle available below 768px and visually compacted the product title without removing its semantic heading. | Responsive CSS source inspection; 400% rendered reflow remains in the manual pass. |
| A-14 | Addressed | Replaced the misleading navigation landmark with a neutral action container. | JSX source inspection. |
| A-15 | Addressed | Added `lang="en"` to every English eyebrow phrase identified by the audit. | Repository search confirms no unmarked `.eyebrow` phrase remains. |
| A-16 | Addressed | Removed automatic toast dismissal; messages remain until explicitly dismissed. | Source inspection confirms no toast timeout remains. |
| A-17 | Addressed in source; manual confirmation pending | Set compact actions to at least 24×32px and principal/select/pagination targets to 44px. | CSS source inspection; rendered rectangles and spacing still require browser measurement. |

## Post-remediation verification

Completed on 3 September 2026:

- `npm run lint` — passed with no reported issues.
- `npm run typecheck` — passed under the project's strict TypeScript configuration.
- `npm test` — 10 test files and 30 tests passed.
- `npm run build` — Next.js 16.3.4 production build passed.
- Runtime smoke check — `/` returned HTTP 200 and `/api/health` reported `status: ok`, a readable workbook, and no workbook lock.
- Headless Chromium visual check — the 500px responsive view retained sync, theme, download, and add actions without page-level horizontal clipping; the 1440px dashboard retained its information hierarchy and table layout.
- Data-safety check — the source Excel workbook remained byte-for-byte unchanged during remediation, with SHA-256 `53899DF01FA3CFCDA96C54F89206EDEF96155CBC09CD6E07CD1836B291549B26`.

Manual acceptance work still required before making a WCAG 2.2 Level AA conformance claim:

- Keyboard-only traversal of search, filters, table/cards, both modal dialogs, and toast dismissal.
- Thai screen-reader verification of required state, result announcements, sync status, modal descriptions, and focus return.
- Exact 320 CSS px and 400% zoom/reflow checks, including target rectangles and focus not obscured by sticky regions.
- 200% text resize, custom text-spacing overrides, forced-colors/high-contrast mode, portrait/landscape orientation, and grayscale chart interpretation.

## Numbered findings

### [A-01] Light-theme text colors fail minimum contrast

- **Result:** Fail
- **Severity:** High
- **WCAG:** [1.4.3 Contrast (Minimum), Level AA](https://www.w3.org/TR/WCAG22/#contrast-minimum)
- **Evidence:** `app/globals.css:10-14`, `app/globals.css:43-49`, `app/globals.css:70`, `app/globals.css:111`, `app/globals.css:135`
- **Observed:** The light theme changes the neutral surfaces but leaves several dark-theme accent colors unchanged. Calculated examples:
  - KPI values: `#a5b4fc` 1.99:1, `#fbbf24` 1.67:1, `#7dd3fc` 1.67:1, and `#4ade80` 1.74:1 against white. These 30px values still require at least 3:1.
  - Status badges: 1.52:1–2.30:1 against their composited light backgrounds; text is 10px and requires 4.5:1.
  - Lock/error alerts: 1.58:1 and 2.46:1 against their composited light backgrounds.
  - White text on the danger button and `#f43f5e` danger text on white: 3.67:1.
- **Impact:** Low-vision users and users in bright environments may be unable to read status, KPI, warning, error, and destructive-action text.
- **Remediation:** Define theme-specific semantic foreground tokens for success, warning, danger, info, and status text. Validate every foreground/background pair at its rendered font size; do not reuse luminous dark-theme colors as light-theme text.
- **Verify:** Recalculate contrast in both themes for every state and confirm 4.5:1 for normal text and 3:1 for qualifying large text.

### [A-02] Form and custom-control boundaries do not reach 3:1

- **Result:** Fail
- **Severity:** High
- **WCAG:** [1.4.11 Non-text Contrast, Level AA](https://www.w3.org/TR/WCAG22/#non-text-contrast)
- **Evidence:** `app/globals.css:5-14`, `app/globals.css:75`, `app/globals.css:80`, `app/globals.css:89-92`, `app/globals.css:113`, `app/globals.css:131`
- **Observed:** The default border is 1.47:1 against the dark surface and 1.32:1 against the light surface. Form-control fills are only 1.05:1 and 1.03:1 from the adjacent surface. These visual boundaries are needed to identify inputs, selects, and unchecked filter controls.
- **Impact:** Users with low vision may not be able to locate editable fields or distinguish interactive controls from static content.
- **Remediation:** Introduce a control-boundary token that provides at least 3:1 against the adjacent surface, or provide a 3:1 contrasting fill/underline that clearly identifies the component.
- **Verify:** Measure default, hover, focus, disabled, checked, and error states in both themes.

### [A-03] The global focus ring is too low contrast in the light theme

- **Result:** Fail
- **Severity:** Medium
- **WCAG:** [1.4.11 Non-text Contrast, Level AA](https://www.w3.org/TR/WCAG22/#non-text-contrast), [2.4.7 Focus Visible, Level AA](https://www.w3.org/TR/WCAG22/#focus-visible)
- **Evidence:** `app/globals.css:23`
- **Observed:** Mixing `#0f766e` at 50% over white produces approximately `#87bbb7`, only **2.14:1** against white. The same rule is the default focus indicator for links, buttons, summaries, and selects.
- **Impact:** Keyboard users with low vision may lose track of focus in the light theme.
- **Remediation:** Use an opaque focus token that reaches at least 3:1 against every adjacent background. A two-layer indicator can preserve visibility across mixed surfaces.
- **Verify:** Tab through every control in both themes and measure the focus indicator against the immediately adjacent color.

### [A-04] Filter-chip focus is visually hidden

- **Result:** Fail
- **Severity:** High
- **WCAG:** [2.4.7 Focus Visible, Level AA](https://www.w3.org/TR/WCAG22/#focus-visible)
- **Evidence:** `components/companies/company-toolbar.tsx:44-46`, `app/globals.css:87-90`
- **Observed:** Filter checkboxes remain keyboard-focusable but are `opacity: 0` and have no `input:focus-visible + span` style. The global outline belongs to the fully transparent input and is therefore not visible on the chip.
- **Impact:** Keyboard users cannot tell which filter option currently has focus.
- **Remediation:** Add a visible focus style to the adjacent chip, for example `input:focus-visible + span`, using a high-contrast outline that is distinct from the selected state.
- **Verify:** Open filters and traverse every checkbox using Tab and Shift+Tab in both themes.

### [A-05] Modal overlays do not provide a complete focus lifecycle

- **Result:** Fail
- **Severity:** High
- **WCAG:** [2.4.3 Focus Order, Level A](https://www.w3.org/TR/WCAG22/#focus-order), [4.1.2 Name, Role, Value, Level A](https://www.w3.org/TR/WCAG22/#name-role-value)
- **Evidence:** `components/sync/conflict-dialog.tsx:2-3`, `components/companies/company-form.tsx:42-58`, `components/companies/company-form.tsx:70-72`, `components/dashboard/dashboard-shell.tsx:81`, `components/dashboard/dashboard-shell.tsx:86`, `components/dashboard/dashboard-shell.tsx:89-90`
- **Observed:** The conflict alert dialog does not move focus inside, contain focus, handle Escape, or return focus. The company drawer manually contains focus but uses `<dialog open>` rather than modal dialog behavior, does not make the background inert, and does not restore focus to the invoking control after unmount.
- **Impact:** Keyboard and screen-reader users can lose their place, remain focused behind a visual overlay, or encounter background content while a modal interaction is active.
- **Remediation:** Use `showModal()` or a proven dialog primitive; make background content inert; focus an appropriate element on open; trap focus; support Escape where safe; and restore focus to the exact invoking control on close.
- **Verify:** Open and close both overlays from every trigger using keyboard only; inspect the accessibility tree and confirm focus return.

### [A-06] Required fields are not programmatically identified as required

- **Result:** Fail
- **Severity:** Medium
- **WCAG:** [1.3.1 Info and Relationships, Level A](https://www.w3.org/TR/WCAG22/#info-and-relationships), [3.3.2 Labels or Instructions, Level A](https://www.w3.org/TR/WCAG22/#labels-or-instructions)
- **Evidence:** `components/companies/company-form.tsx:62-66`, `components/companies/company-form.tsx:77`, `components/companies/company-form.tsx:83`, `components/companies/company-form.tsx:96`
- **Observed:** Required state is shown with `*`, but the controls do not use `required` or `aria-required="true"`. The company-name asterisk is explicitly hidden from assistive technology.
- **Impact:** Screen-reader users may not know which inputs must be completed until validation fails.
- **Remediation:** Add native `required` where appropriate and retain a visible textual explanation such as “* จำเป็น”. Use `aria-required` only when native required semantics cannot be used.
- **Verify:** Inspect the accessibility tree and confirm each required field announces its required state before submission.

### [A-07] The destructive confirmation input has no accessible name

- **Result:** Fail
- **Severity:** High
- **WCAG:** [1.3.1 Info and Relationships, Level A](https://www.w3.org/TR/WCAG22/#info-and-relationships), [3.3.2 Labels or Instructions, Level A](https://www.w3.org/TR/WCAG22/#labels-or-instructions), [4.1.2 Name, Role, Value, Level A](https://www.w3.org/TR/WCAG22/#name-role-value)
- **Evidence:** `components/companies/company-form.tsx:105`
- **Observed:** The delete-confirmation text field is visually preceded by an instruction, but it is not wrapped by a label and has no `aria-label`/`aria-labelledby` association.
- **Impact:** A screen-reader user encounters an unnamed edit field during a permanent-delete workflow.
- **Remediation:** Give the instruction an ID and reference it using `aria-labelledby`/`aria-describedby`, or use a visible `<label>` that wraps the confirmation input.
- **Verify:** Confirm the field exposes a meaningful accessible name and the company-name instruction before enabling deletion.

### [A-08] Pie-chart categories are mapped to segments by color alone

- **Result:** Fail
- **Severity:** Medium
- **WCAG:** [1.4.1 Use of Color, Level A](https://www.w3.org/TR/WCAG22/#use-of-color)
- **Evidence:** `components/dashboard/status-chart.tsx:6-12`
- **Observed:** Pie segments have no persistent labels or patterns. The separate legend maps names to segments only through colored dots. The screen-reader summary helps nonvisual users but does not solve the color-only mapping for sighted users with color-vision deficiencies.
- **Impact:** Users who cannot distinguish the palette cannot associate a slice with its status.
- **Remediation:** Add direct labels, leader lines, patterns, or symbols to slices; keep the text summary. Do not require matching color swatches.
- **Verify:** Confirm the status of every slice remains identifiable in grayscale and without hover.

### [A-09] Selected filter chips rely on color alone

- **Result:** Fail
- **Severity:** Medium
- **WCAG:** [1.4.1 Use of Color, Level A](https://www.w3.org/TR/WCAG22/#use-of-color)
- **Evidence:** `components/companies/company-toolbar.tsx:46`, `app/globals.css:89-90`
- **Observed:** A selected chip differs only through border, background, and text color. There is no checkmark, weight, shape, or explicit selected text.
- **Impact:** Sighted users with color-vision deficiencies may not know which filters are active.
- **Remediation:** Add a checkmark or another non-color state indicator while preserving native checkbox semantics.
- **Verify:** Toggle filters in grayscale and confirm selected/unselected states remain unambiguous.

### [A-10] Search, filter, and pagination result changes are not announced

- **Result:** Fail
- **Severity:** Medium
- **WCAG:** [4.1.3 Status Messages, Level AA](https://www.w3.org/TR/WCAG22/#status-messages)
- **Evidence:** `components/companies/company-toolbar.tsx:40`, `components/companies/company-directory.tsx:42-43`
- **Observed:** Result count, empty-result state, page number, and visible rows update without focus movement, but their containers have no `role="status"`, `aria-live`, or equivalent announcement mechanism.
- **Impact:** Screen-reader users may not know whether a search/filter worked or how many results are available.
- **Remediation:** Add a concise, atomic polite status region for result and page changes. Avoid announcing every keystroke before the existing debounce completes.
- **Verify:** Search, filter, clear, and change page with a screen reader; confirm one concise announcement per settled update.

### [A-11] The global `/` shortcut cannot be disabled or remapped

- **Result:** Fail
- **Severity:** Medium
- **WCAG:** [2.1.4 Character Key Shortcuts, Level A](https://www.w3.org/TR/WCAG22/#character-key-shortcuts)
- **Evidence:** `components/companies/company-toolbar.tsx:12-18`
- **Observed:** Pressing `/` globally moves focus to search except from input/textarea elements. There is no mechanism to disable or remap it, and it is not active only while the search component has focus.
- **Impact:** Speech-input users and users who produce accidental keystrokes can unexpectedly lose focus and context.
- **Remediation:** Support an off/remap preference, or require a non-character modifier combination. At minimum, do not intercept character keys from buttons, selects, contenteditable elements, or assistive-widget contexts.
- **Verify:** Confirm the shortcut satisfies one of the criterion's turn-off, remap, or focus-only conditions.

### [A-12] Mobile header controls lose or mismatch their accessible names

- **Result:** Fail
- **Severity:** High
- **WCAG:** [2.5.3 Label in Name, Level A](https://www.w3.org/TR/WCAG22/#label-in-name), [4.1.2 Name, Role, Value, Level A](https://www.w3.org/TR/WCAG22/#name-role-value)
- **Evidence:** `components/dashboard/dashboard-header.tsx:27-30`, `components/sync/sync-indicator.tsx:12-23`, `app/globals.css:148`
- **Observed:** Below 768px, `.primary-button span` is set to `display: none`. The Add Company button has no explicit `aria-label`; its remaining Lucide icon is `aria-hidden="true"` in rendered HTML. The sync button visibly becomes “ซิงก์”, but its accessible names in the locked and reading states are “Excel ถูกล็อก ตรวจข้อมูลตอนนี้” and “กำลังตรวจ Excel ตรวจข้อมูลตอนนี้”, neither of which contains the visible label.
- **Impact:** Screen-reader users encounter an unnamed core-action button, and speech-input users cannot reliably activate the sync button by its visible name.
- **Remediation:** Add `aria-label="เพิ่มบริษัท"`, or use a visually-hidden label that remains in the accessibility tree instead of `display: none`. Make every sync accessible name include the stable visible word “ซิงก์”, followed by its state.
- **Verify:** At a 320 CSS px viewport, inspect both buttons' accessible names in every sync state and activate them with keyboard, speech, and touch exploration.

### [A-13] Reflow removes the theme-toggle function

- **Result:** Fail
- **Severity:** Medium
- **WCAG:** [1.4.10 Reflow, Level AA](https://www.w3.org/TR/WCAG22/#reflow)
- **Evidence:** `components/dashboard/dashboard-header.tsx:28`, `app/globals.css:148`
- **Observed:** The first header icon button—the theme toggle—is hidden below 768px with no equivalent control elsewhere. A 400% zoom on a typical desktop produces a CSS viewport that activates this rule.
- **Impact:** Users who zoom or use narrow screens lose a display preference that may be necessary for comfortable reading.
- **Remediation:** Keep the theme toggle available in an overflow menu or compact accessible control instead of removing it.
- **Verify:** At 320 CSS px and 400% zoom, confirm all desktop functions remain available without two-dimensional page scrolling.

### [A-14] The header action group is exposed as a navigation landmark

- **Result:** Fail
- **Severity:** Low
- **WCAG:** [1.3.1 Info and Relationships, Level A](https://www.w3.org/TR/WCAG22/#info-and-relationships)
- **Evidence:** `components/dashboard/dashboard-header.tsx:26-31`
- **Observed:** `<nav aria-label="เครื่องมือหลัก">` contains sync, theme, download, and add commands rather than a set of navigation links. This creates a misleading navigation landmark.
- **Impact:** Landmark users may navigate to this region expecting site navigation and instead find application actions.
- **Remediation:** Use a neutral container or `role="toolbar"` with an appropriate label if arrow-key toolbar behavior is implemented; otherwise use a labeled `<div>`/group.
- **Verify:** Inspect the landmark list and confirm only genuine navigation regions are exposed as navigation.

### [A-15] English interface phrases are not marked with their language

- **Result:** Fail
- **Severity:** Medium
- **WCAG:** [3.1.2 Language of Parts, Level AA](https://www.w3.org/TR/WCAG22/#language-of-parts)
- **Evidence:** `components/dashboard/dashboard-shell.tsx:82`, `components/companies/company-directory.tsx:37`, `components/dashboard/status-chart.tsx:11-12`, `components/dashboard/deadline-panel.tsx:9`, `components/companies/company-form.tsx:72`
- **Observed:** The page language is correctly `th`, but phrases such as “PERSONAL APPLICATION WORKSPACE”, “SEARCHABLE DIRECTORY”, “ANNOUNCEMENT”, “TECH FOCUS”, “NEXT 30 DAYS”, and “EXCEL RECORD” lack `lang="en"`.
- **Impact:** Screen readers may pronounce English phrases using Thai pronunciation rules.
- **Remediation:** Mark English phrases with `lang="en"` or replace decorative English labels with Thai text.
- **Verify:** Inspect language nodes and listen with a Thai-capable screen reader voice.

### [A-16] Toast messages impose an unadjustable four-second time limit

- **Result:** Fail
- **Severity:** Medium
- **WCAG:** [2.2.1 Timing Adjustable, Level A](https://www.w3.org/TR/WCAG22/#timing-adjustable)
- **Evidence:** `components/dashboard/dashboard-shell.tsx:30`, `components/dashboard/dashboard-shell.tsx:91`
- **Observed:** Success and error toasts are removed after four seconds. Users cannot pause, extend, or disable the timeout. Some quick-edit errors are available only through this transient presentation.
- **Impact:** Users with cognitive, reading, or low-vision disabilities may miss important feedback before it disappears.
- **Remediation:** Keep error messages until dismissed. For noncritical success messages, provide a user-adjustable duration or a persistent recent-activity/status area.
- **Verify:** Confirm essential messages remain available without a time limit and can be dismissed explicitly.

### [A-17] Compact text-only targets need rendered spacing verification

- **Result:** Needs manual verification
- **Severity:** Low
- **WCAG:** [2.5.8 Target Size (Minimum), Level AA](https://www.w3.org/TR/WCAG22/#target-size-minimum)
- **Evidence:** `app/globals.css:93`, `app/globals.css:96`, `app/globals.css:100`, `app/globals.css:103-104`; main button controls at `app/globals.css:35-41`
- **Observed:** Main buttons are 44px and sync/select/pagination controls are 36–38px, exceeding WCAG's 24 CSS px minimum. However, sortable header buttons, company-name buttons, and clear-filter text buttons have no explicit 24px minimum. They may pass through the spacing exception, but rendered rectangles and neighboring-target distances were not available.
- **Impact:** If spacing is insufficient, users with limited dexterity may activate an adjacent target or miss the intended target.
- **Remediation:** Prefer a 44px product target and set at least 24px minimum hit boxes for every compact action rather than relying on the spacing exception.
- **Verify:** Measure every target rectangle and the 24px-diameter spacing circles at desktop and 320 CSS px widths.

## Positive observations

- The document sets `lang="th"` and provides a descriptive page title.
- The page has one visible `h1`, subordinate `h2` sections, semantic table headers, fieldsets/legends, and a skip link.
- Most form controls use visible wrapping labels; field errors use `aria-invalid` and `aria-describedby`.
- Status badges combine text and distinct icons rather than relying only on color.
- Main command buttons use 44px hit areas, and reduced-motion CSS is present.
- Charts include screen-reader-only textual summaries.
- Toasts and sync state contain live-region semantics, although result changes and toast timing still need correction.

## Original focused A/AA coverage matrix (pre-remediation)

| Criterion | Result | Evidence / annotation |
|---|---|---|
| 1.1.1 Non-text Content | Pass | Rendered Lucide icons are `aria-hidden`; adjacent text/labels provide meaning |
| 1.2.1–1.2.5 Time-based Media | Not applicable | No audio/video in audited interface |
| 1.3.1 Info and Relationships | Fail | A-06, A-07, A-14 |
| 1.3.2 Meaningful Sequence | Pass | Source order follows visual section order |
| 1.3.3 Sensory Characteristics | Pass | Reviewed instructions do not rely only on sensory position/shape |
| 1.3.4 Orientation | Needs manual verification | Rendered portrait/landscape test unavailable |
| 1.3.5 Identify Input Purpose | Not applicable | No scoped user-data inputs requiring WCAG input-purpose tokens |
| 1.4.1 Use of Color | Fail | A-08, A-09 |
| 1.4.2 Audio Control | Not applicable | No audio |
| 1.4.3 Contrast (Minimum) | Fail | A-01 |
| 1.4.4 Resize Text | Needs manual verification | 200% browser test unavailable |
| 1.4.5 Images of Text | Pass | No images of text found |
| 1.4.10 Reflow | Fail | A-13; full 400% layout still needs follow-up |
| 1.4.11 Non-text Contrast | Fail | A-02, A-03 |
| 1.4.12 Text Spacing | Needs manual verification | User-spacing override test unavailable |
| 1.4.13 Content on Hover or Focus | Not applicable | No hover/focus-triggered supplemental content found |
| 2.1.1 Keyboard | Needs manual verification | Native controls dominate, but complete rendered workflow was unavailable |
| 2.1.2 No Keyboard Trap | Needs manual verification | Drawer implements a loop; rendered escape/background behavior needs confirmation |
| 2.1.4 Character Key Shortcuts | Fail | A-11 |
| 2.2.1 Timing Adjustable | Fail | A-16 |
| 2.2.2 Pause, Stop, Hide | Not applicable | Loading indicators are essential/temporary and respect reduced motion |
| 2.3.1 Three Flashes or Below Threshold | Pass | No flashing content found |
| 2.4.1 Bypass Blocks | Pass | Skip link targets the company directory |
| 2.4.2 Page Titled | Pass | Descriptive metadata title |
| 2.4.3 Focus Order | Fail | A-05 |
| 2.4.4 Link Purpose (In Context) | Pass | Download/application links have descriptive text or accessible names |
| 2.4.5 Multiple Ways | Not applicable | Single-view local application |
| 2.4.6 Headings and Labels | Pass | Headings and field labels describe purpose |
| 2.4.7 Focus Visible | Fail | A-03, A-04 |
| 2.4.11 Focus Not Obscured (Minimum) | Needs manual verification | Sticky header/toolbar requires rendered focus traversal |
| 2.5.1 Pointer Gestures | Not applicable | No path or multipoint gestures |
| 2.5.2 Pointer Cancellation | Pass | Actions use click activation, not irreversible pointer-down behavior |
| 2.5.3 Label in Name | Fail | A-12 |
| 2.5.4 Motion Actuation | Not applicable | No device-motion input |
| 2.5.7 Dragging Movements | Not applicable | No drag-only operation |
| 2.5.8 Target Size (Minimum) | Needs manual verification | A-17 |
| 3.1.1 Language of Page | Pass | Root document uses `lang="th"` |
| 3.1.2 Language of Parts | Fail | A-15 |
| 3.2.1 On Focus | Pass | No source-defined context change on focus |
| 3.2.2 On Input | Pass | Input changes update data/state without unexpected navigation |
| 3.2.3 Consistent Navigation | Not applicable | Single-view application |
| 3.2.4 Consistent Identification | Pass | Repeated actions use consistent iconography and labels |
| 3.2.6 Consistent Help | Not applicable | No repeated help mechanism |
| 3.3.1 Error Identification | Pass | Field/server errors are rendered as text |
| 3.3.2 Labels or Instructions | Fail | A-06, A-07 |
| 3.3.3 Error Suggestion | Needs manual verification | Zod messages exist; rendered error quality was not exercised |
| 3.3.4 Error Prevention (Legal, Financial, Data) | Pass | Destructive deletion requires exact-name confirmation and backups exist |
| 3.3.7 Redundant Entry | Not applicable | No multi-step re-entry process |
| 3.3.8 Accessible Authentication (Minimum) | Not applicable | No authentication |
| 4.1.2 Name, Role, Value | Fail | A-05, A-07, A-12 |
| 4.1.3 Status Messages | Fail | A-10 |

## Original remediation order

1. **Fix core operability:** A-04, A-05, A-07, A-12.
2. **Repair the color system:** A-01, A-02, A-03, then verify every theme/state pair.
3. **Remove non-color and communication barriers:** A-08, A-09, A-10, A-15, A-16.
4. **Preserve responsive functionality and semantics:** A-06, A-11, A-13, A-14.
5. **Run the manual verification pass:** A-17 plus orientation, zoom/reflow, text spacing, focus obscuring, keyboard-only flows, and a Thai screen-reader/browser combination.

## Re-test acceptance criteria

- No confirmed A/AA failure remains in the audited routes and states.
- Every focusable element has a visible, measured focus indicator in both themes.
- Modal focus enters, remains contained, and returns to the invoking control.
- All controls expose an accurate accessible name, role, state, and required state.
- Light and dark themes meet measured text and non-text contrast requirements.
- Selected states and chart mappings remain understandable in grayscale.
- Search/filter/page changes are announced once after the update settles.
- All functionality remains available at 320 CSS px and all targets meet 2.5.8 directly or through a verified exception.
