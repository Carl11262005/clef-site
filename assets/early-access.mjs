import { createGoogleSignup } from './signup-flow.mjs';

const googleButton = document.getElementById('googleSignup');
const status = document.getElementById('signupStatus');
const kitContainer = document.getElementById('kitSignup');
const fallback = document.getElementById('signupFallback');
let authReady = false;
let googleBusy = false;
let emailBusy = false;
let allowGoogleSubmission = false;
let subscribed = false;
let emailTimer;
const notify = message => { status.textContent = message; };
const kitForm = () => kitContainer.querySelector('form[data-uid="c338b66b93"]');
const emailField = () => kitForm()?.querySelector('input[name="email_address"]');
const kitSucceeded = () => Boolean(kitContainer.querySelector('.formkit-alert-success')?.textContent.trim());

function updateControls() {
  const input = emailField();
  const formReady = Boolean(input);
  if (input) {
    input.type = 'email';
    input.autocomplete = 'email';
    input.setAttribute('aria-label', 'Email address');
  }
  if (kitSucceeded()) subscribed = true;
  fallback.hidden = formReady || subscribed;
  googleButton.disabled = !authReady || !formReady || googleBusy || emailBusy || subscribed;
  if (subscribed) {
    googleButton.hidden = true;
    document.querySelector('#earlyAccess .signup-divider').hidden = true;
  }
}
new MutationObserver(updateControls).observe(kitContainer, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
updateControls();

// Kit owns the normal email submission, error handling, and server-confirmed
// success message. Prevent competing email/Google attempts during one signup.
kitContainer.addEventListener('submit', event => {
  if (googleBusy && !allowGoogleSubmission) {
    event.preventDefault(); event.stopImmediatePropagation();
    return;
  }
  emailBusy = true;
  clearTimeout(emailTimer);
  emailTimer = setTimeout(() => {
    if (emailBusy && !googleBusy) notify('We could not confirm your signup yet. Check your inbox, then reload this page if you need to try again.');
  }, 30000);
  notify('Sending your signup…');
  updateControls();
}, true);
new MutationObserver(() => {
  if (kitSucceeded() || kitContainer.querySelector('.formkit-alert-error li')) {
    clearTimeout(emailTimer);
    emailBusy = false;
    if (!googleBusy) notify('');
    updateControls();
  }
}).observe(kitContainer, { childList: true, subtree: true });

function subscribeGoogleEmail(email) {
  return new Promise((resolve, reject) => {
    const form = kitForm();
    const input = emailField();
    if (!form || !input) { reject(new Error('The signup form is unavailable. Please reload and try email signup.')); return; }
    let timer;
    const observer = new MutationObserver(() => {
      if (kitSucceeded()) finish();
      else {
        const error = form.querySelector('.formkit-alert-error li');
        if (error?.textContent.trim()) finish(new Error(error.textContent.trim()));
      }
    });
    function finish(error) {
      clearTimeout(timer); observer.disconnect();
      input.readOnly = false;
      emailBusy = false;
      error ? reject(error) : resolve();
    }
    input.disabled = false;
    input.value = email;
    input.readOnly = true;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    form.querySelector('[type="submit"], [data-element="submit"]').disabled = false;
    observer.observe(kitContainer, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    timer = setTimeout(() => finish(new Error('We could not confirm your signup yet. Check your inbox before trying again.')), 30000);
    allowGoogleSubmission = true;
    try { form.requestSubmit(); } catch { finish(new Error('Signup could not be sent. Please try email signup below.')); }
    finally { allowGoogleSubmission = false; }
  });
}

// Pinned official Firebase modules. Email signup remains independent if the
// authentication SDK cannot load. No client secret or Kit API key is needed.
try {
  const [appSDK, authSDK] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js'),
  ]);
  const app = appSDK.initializeApp({
    apiKey: 'AIzaSyC-5t-8XfkRnz-05iueLgrSQoLV4gf6ivU',
    authDomain: 'clef-app.firebaseapp.com',
    projectId: 'clef-app',
    appId: '1:71968821553:web:351c66465bcef780372010',
  }, 'clef-website-early-access');
  const auth = authSDK.initializeAuth(app, { persistence: authSDK.inMemoryPersistence, popupRedirectResolver: authSDK.browserPopupRedirectResolver });
  const provider = new authSDK.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const signup = createGoogleSignup({
    authenticate: async () => (await authSDK.signInWithPopup(auth, provider)).user,
    subscribe: subscribeGoogleEmail,
    notify,
    setBusy(value) {
      googleBusy = value;
      const input = emailField();
      if (input) { input.disabled = value; if (!value) input.readOnly = false; }
      updateControls();
    },
  });
  googleButton.addEventListener('click', signup);
  authReady = true;
  updateControls();
} catch {
  notify('Google sign-in could not load. You can still join using your email below.');
}
