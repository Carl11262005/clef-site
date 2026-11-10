# Files added for the actual-app demo

All implementation is isolated in `conference-demo/`. Product screen modules are re-exported from `frontend/app/`; those files were not edited by this work.

- `.gitignore`
- `adapters/firebase.ts`
- `adapters/fontImage.ts`
- `adapters/location.ts`
- `adapters/map.tsx`
- `adapters/mapRuntime.ts`
- `adapters/reporting.ts`
- `adapters/tabs.tsx`
- `adapters/transport.ts`
- `adapters/unavailable.tsx`
- `app.json`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/calendar/_layout.tsx`
- `app/(tabs)/calendar/index.tsx`
- `app/(tabs)/discoverVenues/_layout.tsx`
- `app/(tabs)/discoverVenues/all.tsx`
- `app/(tabs)/discoverVenues/index.tsx`
- `app/(tabs)/listingsTabRouter/_layout.tsx`
- `app/(tabs)/listingsTabRouter/expired.tsx`
- `app/(tabs)/listingsTabRouter/index.tsx`
- `app/(tabs)/messages/_layout.tsx`
- `app/(tabs)/messages/index.tsx`
- `app/(tabs)/profile/_layout.tsx`
- `app/(tabs)/profile/index.tsx`
- `app/+not-found.tsx`
- `app/_layout.tsx`
- `app/chat/[chatId].tsx`
- `app/demo.tsx`
- `app/index.tsx`
- `app/manageListings/listingScreen/ListingInContact.tsx`
- `app/manageListings/listingScreen/ListingScreen.tsx`
- `app/musician/[uid].tsx`
- `app/pipeline.tsx`
- `app/venue/ApplyNightSheet.tsx`
- `app/venue/[id].tsx`
- `babel.config.js`
- `build.mjs`
- `metro.config.js`
- `package.json`
- `preview.py`
- `tsconfig.json`
- `web-deps/package-lock.json`
- `web-deps/package.json`
- `LAUNCH.md`
- `guidance/ConferenceGuide.tsx`
- `guidance/model.ts`
- `guidance/musicianFlow.ts`
- `guidance/presentation.ts`
- `guidance/ui.ts`
- `guidance/guide.css`
- `guidance/entry.css`
- `tests/guide.test.ts`
- `README.md`
- `FILES.md`

Removed the rejected files created earlier in this session: `frontend/public/demo/{index.html,demo.css,demo.js,favicon.svg,BricolageGrotesque-ExtraBold.ttf,FONT-LICENSE.txt}` and `frontend/scripts/build-conference-demo.mjs`. Existing unrelated repository changes were preserved.

## Release-matching and design-reference update

Added `source.json`, `prepare-source.mjs`, `guidance/WelcomeButton.tsx`, `adapters/timePicker.tsx`, and 17 optimized existing welcome photographs under `assets/welcome/`. `.source/` and `.generated/` are ignored build inputs, not hand-edited application code.

Updated `app/index.tsx`, `guidance/entry.css`, `guidance/model.ts`, `guidance/ui.ts`, `adapters/map.tsx`, `metro.config.js`, `tsconfig.json`, `build.mjs`, `.gitignore`, `tests/guide.test.ts`, README/FILES/LAUNCH.

Added `docs/design/{README,SOURCE-OF-TRUTH,FOUNDATIONS,SCREEN-PATTERNS,INTERACTION,AGENT-WORKFLOW,CONFERENCE-DEMO}.md` and `reference.json`. Linked the folder from root `AGENTS.md` and `CLAUDE.md`. Native frontend/backend source files were not changed by this update.

Visual documentation: `docs/design/VISUAL-REFERENCE.md`, `docs/design/images/conference-welcome-web.png`, `docs/design/images/conference-roles-web.png`.
