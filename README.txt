Deploying the new CLEF site to Firebase Hosting
================================================

1. Unzip this folder.
2. In a terminal, cd into it (the folder containing firebase.json).
3. If you don't have the Firebase CLI: npm i -g firebase-tools
4. firebase login   (one time)
5. firebase deploy

That's it — index.html is served as the site root, with assets/ alongside it.

To preview on a real phone before going fully live, use a preview channel instead of step 5:
  firebase hosting:channel:deploy preview
This gives you a temporary URL to open in Safari on your iPhone.
