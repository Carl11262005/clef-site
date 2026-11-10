# Launch verification — November 2, 2026

Corrected actual-app demo deployed successfully as Sites version 3 at:

https://clef-ceo-conference-demo.carl412.chatgpt.site/demo/

- Project: `appgprj_6ae9270754448191b814100353edc6a0`
- Version: `appgprj_6ae9270754448191b814100353edc6a0~appgver_20a516b36f4c81918aa1f6ef9767f9e1`
- Deployment: `appgdep_6ae92d6c4a8c8191999c7db75be12b99` (succeeded)
- Distribution commit: `776a6e78153bd3865e7ed674d274ce78c8c860ee`
- Distribution archive: `/private/tmp/clef-real-app-deploy-v3.tar.gz`

The rejected static HTML mockup was replaced. The final public browser check verified musician application, venue open date, Accept → In Contact, local welcome-message result, restart/switch role, fonts/icons, and deep-page refresh without authentication. Curl received HTTP 200 for the public demo, the pipeline document, and the icon font. Python urllib was rejected by the host with 403; the ordinary browser and curl worked. No auth token/cookie was supplied to curl.

The separate physical-phone/cellular test has been requested and is **not yet confirmed**. No print QR has been generated, no physical QR scan has been performed, and no PDF has been changed. This URL is live for review; it is not yet cleared for printed QR signs.

Screenshots:
- `/Users/cj/Downloads/CLEF official/clef-real-demo-application-live.jpg`
- `/Users/cj/Downloads/CLEF official/clef-real-demo-pipeline-live.jpg`

No native application deployment, OTA update, production API write, app-repository commit or app-repository push was performed.

## Optional guidance update — version 4

Deployed successfully to the same `/demo/` URL on November 2, 2026.

- Version: `appgprj_6ae9270754448191b814100353edc6a0~appgver_a32e20fde704819190cadd1388e729eb`
- Deployment: `appgdep_6ae94a61e18481918ee75d0e453df0a2`
- Distribution commit: `375f2deb4163fede4ffa321c39256c7ef246fecf`
- Archive: `/private/tmp/clef-guided-app-deploy.tar.gz`

Added a contextual, collapsible guide: 3 musician steps and 4 venue steps, including instructions for each existing date/time and acceptance modal. The guide follows actual navigation and demo milestones; it never automatically applies, accepts, or sends. It offers scroll/navigation help and preserves free exploration. Original product screens and workflows remain unchanged.

Validation: 6 guide progression tests passed; strict demo typecheck, scoped lint and export passed. At 390×844, both public workflows reached their local completion states; hide/show, role switching and keep-exploring worked. The 320×740 application screen had no horizontal page overflow and its Send application control remained visible. Screen-reader instructions appeared inside the active time-selection dialog. No browser errors were recorded in the live smoke check.

Screenshot: `/Users/cj/Downloads/CLEF official/clef-step-guide-live.jpg`.

The user reported actively testing on a phone and requested this guidance update. Final physical-phone/QR verification remains unconfirmed. Existing phone sessions must refresh to load version 4. No PDF/QR artwork or native app release was performed.

## November 2 welcome attempt — rejected; source correction required

Version 5 was published successfully at the existing public URL. Source distribution commit: `29c52cc7177b84593996ebb138b586f9fb9d777f`. Saved version: `appgprj_6ae9270754448191b814100353edc6a0~appgver_30f88d40d7f481918d95e03a523a4c07`. Deployment: `appgdep_6ae959df4a3c819189a1a9b5064e8daa`.

The user rejected its visual direction as different from current Android/TestFlight. Do not treat this design as approved. It used a custom welcome based on the older checkout's onboarding scaffold, theme and Bricolage typography, without first verifying released UI.

Read-only EAS verification found both latest production update groups use `edf7d3dfd2845566aa49d20359e5411b826278ca`: Android group `52efa8fd-28d2-40ae-a742-2c4d831c836a`, iOS group `5c119f15-a39b-4c8e-8f6a-90da6cda540e`. This exact commit is available at `/private/tmp/clef-capacity-live-20261031`; the demo currently imports `/Users/cj/Desktop/Clef-App/frontend`, whose HEAD is `26100eb` plus unrelated dirty work. Discover, Calendar and demo modules differ substantially. Reconcile the demo with the verified production source before another design/publish pass; preserve both existing checkouts. Production metadata verifies the published source, not the version currently running on a particular physical phone.

Version 5 build/typecheck/lint and six guide tests passed. Local checks covered 320/390px layouts, both role handoffs, keyboard step focus, back/change side/reset, optional tips and calendar modal spacing. The user interrupted final public smoke checks to reject the design; do not claim final live flow verification or phone/QR approval for version 5.

## November 2, 2026 — release-matched version 6

Published to the existing public site at `https://clef-ceo-conference-demo.carl412.chatgpt.site/demo/`.

- App source pin: `edf7d3dfd2845566aa49d20359e5411b826278ca` (both verified production EAS updates).
- Distribution commit: `24bcf076cff2425615348bbab30123d15590c11f`.
- Version: `appgprj_6ae9270754448191b814100353edc6a0~appgver_8bb6c50701088191a6180c617008e8eb`.
- Deployment: `appgdep_6ae95eb3062081918191f76809230b60`, succeeded.
- Archive: `/private/tmp/clef-release-matched-demo.tar.gz`.

Replaced the rejected custom entrance with the released photo-wall welcome and app role-selection/scaffold patterns. Updated actual app imports to a generated snapshot of the verified commit, with a guard rejecting unpinned source modules. Kept the light demo notice and optional step guidance. Added web compatibility for map fitBounds and the current time picker; source app screens were not edited.

Validation: isolated strict TypeScript, Expo export, source-provenance/production-SDK audit, scoped ESLint, seven guide tests, documentation JSON/component/link checks. Local browser checks covered keyboard entry, disabled Continue until selection, back and switching, 320px/390px layouts, short 520px-height welcome scrolling, desktop, both role flows, applicant profile, time adjustment, modal spacing and reset. Public browser checks verified cached photographs, musician discovery/profile/application completion, venue date opening/Accept/message/In Contact completion and reset; no browser errors were logged in the public test tab.

Known inherited sample limitation: pipeline displays The Copper Hollow through both listing and night-application fixture rows. This was documented, not silently changed in native code. Some inherited native accessibility/contrast patterns remain; this task did not perform a complete app accessibility audit or physical reduced-motion/device test.

Design documentation added under `docs/design/`, linked from AGENTS.md and CLAUDE.md, with source provenance, foundations, screen owners, interactions, agent workflow, conference boundaries and labelled web screenshots. Neither native app/backend code nor native deployment configuration was changed. This is a web-only publication, with no reinstall or OTA required.

Physical-phone verification of this revision, cellular conditions and actual printed QR scan remain unconfirmed. No QR/PDF work was performed.

## November 2, 2026 — Band entry and compact Discover guide, version 7

Published to the same public site at `https://clef-ceo-conference-demo.carl412.chatgpt.site/demo/`.

- Distribution commit: `2296b4ecd45b27e39963471353f685000475cb3a`.
- Version: `appgprj_6ae9270754448191b814100353edc6a0~appgver_7fbc91842dec81918035e63a59bf6ee4`.
- Deployment: `appgdep_6ae96130b2888191bcb985cf849676b4`, succeeded.
- Archive: `/private/tmp/clef-conference-band-map-v7.tar.gz`.

Added the released app's Band choice alongside Musician and Venue. Band retains band-specific setup and guide language, then enters the existing musician-side Discover/application workflow with the illustrative three-piece band profile. No new product workflow or production write was added.

The first musician/band Discover guide now uses a shorter instruction and compact two-line treatment, leaving more of the map visible. Later guide steps keep their full explanations.

Validation: isolated strict TypeScript/export/source audit passed; documented scoped ESLint and all seven guide tests passed. Local and public browser checks selected Band, confirmed band-specific setup, entered Discover, and showed the compact `BAND · STEP 1 OF 3` guide above the map. The public deployment returned a succeeded state. A separate physical-phone check of version 7 and printed QR scan remain unconfirmed.

## November 2, 2026 — prototype-wide spacing pass, version 8

Published to the same public site at `https://clef-ceo-conference-demo.carl412.chatgpt.site/demo/`.

- Distribution commit: `1574a1fa46defefcc4a746bf31c71179cc801752`.
- Version: `appgprj_6ae9270754448191b814100353edc6a0~appgver_8d8fa88de7dc8191aaec34e5dcfbbab8`.
- Deployment: `appgdep_6ae9670636048191b5143fe7df4a3633`, succeeded.
- Archive: `/private/tmp/clef-spacing-pass-v8.tar.gz`.

Rebalanced the whole prototype entrance: tighter released-scaffold gutters and footer spacing, three compact horizontal role cards, a shorter readiness panel and more consistent spacing between supporting notes. Musician, Band and Venue behavior remains unchanged.

Removed the separate fixed demo-control row. Sample status, role switching and optional tips now share one warm app-colored guide surface. In the tested browser viewport, expanded Discover chrome decreased from 104px to 76px and map height increased from 275px to 303px. Collapsing tips reduces the chrome to 50px.

Validation: isolated strict TypeScript/export/source audit, scoped ESLint, diff check and all seven guide tests passed. Local browser checks covered all three role cards, Band readiness, expanded/collapsed guidance and Discover. Public checks covered the compact entrance and Musician Discover handoff; the deployed guide measured 76px and the map 303px in the test viewport. Physical-phone confirmation of version 8 and a printed QR scan remain unconfirmed.

## November 4, 2026 — in-screen coach card, version 9

Published to the same public site at `https://clef-ceo-conference-demo.carl412.chatgpt.site/demo/`.

- Distribution commit: `c70ee592e0cc6da7e2ecf3fa7f15ed970ddc967e`.
- Version: `appgprj_6ae9270754448191b814100353edc6a0~appgver_a75d1c9ea69c819194aeb1d4736693a7`.
- Successful deployment: `appgdep_6aeb95c43a5c8191a8fead8a2486dc47`.
- Archive: `/private/tmp/clef-coach-card-v9.tar.gz`.

Removed the fixed instruction strip from the top of every product screen. Guidance now appears as a readable in-screen coach card above app navigation, with a clear `Next step` label, 19–20px task title, normal body copy, real milestone progress and secondary Switch role/Minimize controls. Minimizing leaves one orange 44px `Next step` pill. The card automatically reopens when the real next task changes. Modal screen-reader announcements remain intact.

The first publish attempt for this saved version returned the provider's generic `Failed to publish the built site` result. Retrying the same immutable saved version succeeded; version 8 remained live until the successful retry.

Validation: fresh isolated TypeScript/export/source audit, scoped ESLint, diff check and all seven guide tests passed. The final source was checked locally at 390×844 in expanded and minimized states, including automatic reopening on the venue profile. The successful public deployment was then checked at 390×844 through Band → Discover; both the expanded coach card and minimized pill rendered correctly. Physical-device and printed-QR verification remain separate and unconfirmed.

## November 4, 2026 — non-blocking guide, version 10

Published to the same public site at `https://clef-ceo-conference-demo.carl412.chatgpt.site/demo/`.

- Distribution commit: `ab70a0532f7f29195e9ad65f5421a8fb390d015e`.
- Version: `appgprj_6ae9270754448191b814100353edc6a0~appgver_bd55c9ab02448191b99d3f6181966877`.
- Successful deployment: `appgdep_6aeb98b1589c8191948b15a1a60185af`.
- Archive: `/private/tmp/clef-nonblocking-guide-v10.tar.gz`.

The guide now starts as the compact orange `Next step` pill on every product screen. Route and milestone changes collapse the coach card instead of opening it over the next product control. Navigation and scroll shortcuts also collapse the card before they run. The visitor can still open, minimize and reopen the coach card explicitly.

Validation: all nine guide tests passed, including new presentation-state regressions; isolated strict TypeScript/export/source audit, scoped ESLint and diff checks passed. Local and public 390×844 Band flows verified an unobstructed Discover map, opening The Lamplighter Room, a collapsed `2/3` guide on the venue profile and automatic collapse before `Show open nights` scrolled. The deployment returned a succeeded state. Separate physical-device and printed-QR verification remain unconfirmed and must not be inferred from browser or deployment success.

## November 4, 2026 — tutorial-matching musician conversation, version 11

Published to the same public site at `https://clef-ceo-conference-demo.carl412.chatgpt.site/demo/`.

- Distribution commit: `82e8fe553b9d8136544b4d047c0a1f1c1033903a`.
- Version: `appgprj_6ae9270754448191b814100353edc6a0~appgver_7c245abef788819193014ca14d37702e`.
- Successful deployment: `appgdep_6aeb9c9c974481918f086b77f50c4ae2`.
- Archive: `/private/tmp/clef-three-step-musician-v11.tar.gz`.

The Musician and Band paths still contain exactly three numbered steps. Step 3 now continues after the application: Send application automatically opens Messages, the selected venue asks about the 9–11 set time, the visitor sends two messages, the first reply introduces the sample $300 pay and the second reply unlocks View terms. The real chat and booking-terms screens are used. All applications, messages, replies and terms remain local fixtures; no production write is made.

Validation: twelve guide/flow tests passed after red-green regression checks; the isolated strict TypeScript/export/source audit and scoped ESLint passed. Local and public browser runs at 390×844 completed Musician → The Lamplighter Room → Nov 6 → Send application → automatic Messages handoff → two sent messages → View terms → Booking Terms. The public deployment returned a succeeded state. The broader repository `walkthrough.test.ts` remains red before its musician checks because the separate, untracked `venueManagerScenario.tsx` imports the app store; this update did not modify that file. Separate physical-device and printed-QR verification remain unconfirmed.

## November 4, 2026 — direct venue chat and guided quick replies, version 12

Published to the same public site at `https://clef-ceo-conference-demo.carl412.chatgpt.site/demo/`.

- Distribution commit: `d1087f4491430f6acc1e797f09bfef7fd95c1ef1`.
- Version: `appgprj_6ae9270754448191b814100353edc6a0~appgver_59900e89c2f48191b6511a4ef0c49199`.
- Successful deployment: `appgdep_6aeb9f7573c88191a8a8fdf8663f5af7`.
- Archive: `/private/tmp/clef-direct-chat-v12.tar.gz`.

After Send application, the musician or band now lands directly in the exact Lamplighter conversation for the applied night instead of the Messages list. Entering chat starts a new three-step guide section at 1/3. Two tutorial-matched quick replies can be sent with one tap, while the existing text field remains available for a custom response. The first send advances to 2/3 and introduces the sample $300 pay; the second advances to 3/3 and unlocks the real View terms action.

Validation: thirteen focused guide/flow tests passed after a red-green regression cycle; pinned-source preparation, strict isolated build/source audit, Expo export and scoped ESLint passed. Local and public 390×844 browser runs verified application → exact chat URL → 1/3 → 2/3 → 3/3 → Booking Terms, with no new browser errors. All applications, messages, replies and terms remain local fixtures. Separate physical-device, cellular and printed-QR verification remain unconfirmed.
