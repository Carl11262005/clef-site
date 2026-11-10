CLEF Website
============

Static marketing website for CLEF, connecting venues with musicians and bands.
Live website: https://clefapp.net/

Pages
-----
/                  Homepage and early-access signup
/venues/           Venue introduction and interactive prototype
/musicians/        Musician/band introduction and interactive prototype
/about/            Mission and founder's note
/privacy/          Existing privacy information
/delete-account/   Existing account-deletion information

Local preview
-------------
From the repository root:
  python3 -m http.server 4175 --bind 127.0.0.1
Open http://127.0.0.1:4175/

The website is HTML, CSS, and browser JavaScript. No frontend build is required.
The committed prototype/ directory is the browser-ready demo export. Editable
prototype source and reproducible integration instructions are in .prototype/.
The prototype uses sample data, never a production app session. Its read-only
map uses OpenFreeMap tiles. Production Firebase/axios transports are excluded
by the prototype build's source audit.

Signup
------
The current Kit form remains the source of truth for subscription success.
Website signup asks for venue/musician/band role and city/state, then email or
Google. Do not change the Kit form schema, auth configuration, or automation
without checking assets/early-access.mjs and its controlled integration tests.
A localhost page still uses the real Kit form unless intercepted by a test.
Never submit a live test subscriber without authorization.

Validation
----------
Tests are under .tests/. Browser checks use Playwright, which must be available
to Node. Run:
  node --test --test-concurrency=1 .tests/*.test.mjs
If using a separately installed Playwright runtime, set NODE_PATH to its
node_modules directory. Tests use reserved fixture identities, not live signups.

Publishing
----------
Hosting is Firebase project/site clef-app. The existing GitHub Actions workflow
publishes pushes to main. Verify its run after a push; a pushed commit by itself
is not deployment proof.

The existing GitHub deployment service account uses Firebase Hosting Admin plus
projects/clef-app/roles/githubHostingServiceCheck. That custom role contains only
serviceusage.services.get, which the deployment CLI needs to check that the
Hosting API is enabled. Credentials remain in the existing GitHub repository
secret; do not commit service-account keys to this repository.

An authorized maintainer with an existing Firebase CLI login can publish the
exact committed snapshot using:
  firebase deploy --only hosting --project clef-app --non-interactive

Keep hidden source, tests, Git metadata, and local review evidence excluded from
Hosting. firebase.json explicitly ignores hidden directories and node_modules.
After publishing, verify the live HTML/assets match the intended commit.

Local review screenshots and test subscriber records are not release artifacts.
