# CLEF conference demo

Standalone source project for the guided CLEF browser prototype shown at the conference. It imports actual CLEF app screens from a pinned release commit, uses sample data, and makes no production API calls. This repository is separate from the CLEF app repository.

## Build

The demo requires a local checkout of [CLEF App](https://github.com/Clef-App-LLc/Clef-App) because it reuses the app screens and Expo dependencies. Check out the commit in `source.json` and run `npm ci` inside its `frontend/` folder. Then from this repository:

```sh
CLEF_APP_REPO=/absolute/path/to/Clef-App node build.mjs
python3 preview.py --port 4174
```

Open `http://127.0.0.1:4174/demo/`. The build checks that the app checkout's dependency lock matches the pinned release, copies that release's source into ignored `.source/`, runs a strict typecheck, and exports the browser build to ignored `output/`. Generated files, dependencies, and the export are intentionally not committed.

## Distribution

The static export currently published at [the conference demo](https://clef-ceo-conference-demo.carl412.chatgpt.site/demo/) is stored separately in the local distribution checkout at `/Users/cj/Downloads/CLEF official/conference-demo-publish`. This source repository does not publish an app update or change the live site.

`LAUNCH.md` records the most recent browser checks and remaining physical-phone and printed-QR checks. `FILES.md` is the original implementation record.
