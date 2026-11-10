# CLEF website prototype integration

`source/` is the unmodified source from the user-selected repository:
https://github.com/Clef-App-LLc/clef-conference-demo
Commit: `1c8dca44ae18bac0a0d957af91eb260b10c733f7`.

It imports CLEF app release `edf7d3dfd2845566aa49d20359e5411b826278ca`.
Generated public assets live in `/prototype/`. This hidden source directory is
excluded from Firebase Hosting by the website's existing ignore rules.

Build with the matching app dependencies already installed:

```sh
CLEF_APP_REPO=/absolute/path/to/Clef-App node .prototype/build.mjs
```

Optional `CLEF_DEMO_WEB_DEPS` points to an existing installation of the prototype's
locked `web-deps/node_modules`. Otherwise the build runs its locked `npm ci`.

Website-only adaptations: Expo base URL `/prototype`, role-specific entry at the
original readiness screen, local signup links, and namespaced static asset URLs.
All actual product screens, demo fixtures, guidance, and transport adapters remain
the repository's implementation. Its build checks exclude production Firebase
and axios modules and omit source maps from public output. No app files are edited.
